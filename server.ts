import express from 'express';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const app = express();
const PORT = 3000;

// Trust proxy is required for rate limiting behind Cloud Run/GFE/Vercel
app.set('trust proxy', 1);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1'
  });
});

// Security headers - temporarily disabled to debug Auth issues
app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

// Helper to decode HTML entities and clean text
const decodeHtml = (str: string) => {
  if (!str) return '';
  if (typeof str !== 'string') return String(str);

  // First pass: replace common block tags with newlines
  let processed = str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n');

  // Use cheerio to decode entities and strip remaining tags
  const $ = cheerio.load(`<span>${processed}</span>`);
  let text = $('span').text().trim();
  
  // Second pass: handle double-encoded entities (like &amp;lt;)
  if (text.includes('&')) {
    const $2 = cheerio.load(`<span>${text}</span>`);
    text = $2('span').text().trim();
  }

  // Fix common encoding artifacts
  text = text.replace(/Â/g, '');
  
  return text;
};

const parseDuration = (duration: string) => {
  if (!duration) return null;
  // Handle ISO 8601 duration (e.g., PT1H30M)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = match[1] ? `${match[1]}h ` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    const seconds = match[3] ? `${match[3]}s` : '';
    return (hours + minutes + seconds).trim() || duration;
  }
  return duration;
};

// API Route for importing recipes
app.post('/api/import', apiLimiter, async (req, res) => {
  let { url } = req.body;
  console.log(`[Import] Request received for URL: ${url}`);
  
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Normalize URL
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  // Validate URL
  try {
    const targetUrl = new URL(url);
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are allowed.' });
    }
    
    const hostname = targetUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return res.status(400).json({ error: 'Access to internal network addresses is forbidden.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  const fetchWithRetry = async (urlToFetch: string, useProxy = false, proxyIndex = 0): Promise<any> => {
    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
    ];

    const finalUrl = useProxy ? proxies[proxyIndex](urlToFetch) : urlToFetch;
    console.log(`[Import] Fetching: ${finalUrl} (Proxy: ${useProxy}, Index: ${proxyIndex})`);
    
    return axios.get(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      },
      timeout: 2500, // Slightly increased but still safe
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: (status) => status < 400
    });
  };

  try {
    let response;
    try {
      response = await fetchWithRetry(url);
    } catch (error: any) {
      console.log(`[Import] Direct fetch failed: ${error.message}`);
      try {
        response = await fetchWithRetry(url, true, 0);
      } catch (proxyError1: any) {
        console.log(`[Import] First proxy failed: ${proxyError1.message}`);
        try {
          response = await fetchWithRetry(url, true, 1);
        } catch (proxyError2: any) {
          console.log(`[Import] Second proxy failed: ${proxyError2.message}`);
          throw new Error(`The website is blocking automated access. Please try another URL or copy-paste manually.`);
        }
      }
    }
    
    if (!response || !response.data) {
      throw new Error('Empty response from server');
    }

    console.log(`[Import] Successfully fetched content. Length: ${response.data.length}`);
    const $ = cheerio.load(response.data);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    let recipeData: any = null;

    jsonLdScripts.each((_, element) => {
      try {
        const content = $(element).html();
        if (!content) return;
        const json = JSON.parse(content);
        const findRecipe = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj['@type'] === 'Recipe' || (Array.isArray(obj['@type']) && obj['@type'].includes('Recipe'))) return obj;
          
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const found = findRecipe(item);
              if (found) return found;
            }
          }
          
          // Check for @graph
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            return findRecipe(obj['@graph']);
          }

          // Recursive search in all properties
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
              const found = findRecipe(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        
        const found = findRecipe(json);
        if (found) {
          recipeData = found;
          return false; // break
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    const commonUnits = [
      'grams', 'gram', 'g', 'kg', 'kilograms', 'kilogram',
      'cup', 'cups', 'c',
      'tsp', 'teaspoon', 'teaspoons',
      'tbsp', 'tablespoon', 'tablespoons',
      'ml', 'milliliters', 'millilitre', 'l', 'liters', 'litre',
      'oz', 'ounce', 'ounces',
      'lb', 'pound', 'pounds',
      'pinch', 'pinches',
      'dash', 'dashes',
      'clove', 'cloves',
      'can', 'cans',
      'packet', 'packets',
      'package', 'pkg',
      'container', 'containers',
      'jar', 'jars',
      'bottle', 'bottles',
      'bag', 'bags',
      'box', 'boxes',
      'tub', 'tubs',
      'envelope', 'envelopes',
      'slice', 'slices',
      'handful', 'handfuls',
      'sprig', 'sprigs',
      'stalk', 'stalks',
      'head', 'heads',
      'bunch', 'bunches',
      'leaf', 'leaves',
      'inch', 'inches',
      'piece', 'pieces',
      'strip', 'strips',
      'floz', 'fluidounce', 'fluidounces',
      'pint', 'pints',
      'quart', 'quarts',
      'gallon', 'gallons'
    ];

    const parseIngredient = (ing: string) => {
      // Clean up the string and normalize spaces
      let cleanIng = decodeHtml(ing).trim().replace(/\s+/g, ' ');
      
      // Strip footnotes like ¹, ², ³
      cleanIng = cleanIng.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '');
      
      let amount = '';
      let remaining = cleanIng;
      let unit = '';

      // 1. Check for amount at the beginning
      const amountRegex = /^(\d+\s+to\s+\d+|\d+[\s-–—]+\d+|\d+\s+[\d\/]+|\d+[\u00BC-\u00BE\u2150-\u215E]|[\d\/]+|[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E][\s-–—]+[\u00BC-\u00BE\u2150-\u215E]|\d+[\s-–—]+[\u00BC-\u00BE\u2150-\u215E]|\d*\.\d+|\d+|[Aa]\s+few|[Ss]ome|[Tt]o\s+taste)/;
      const amountMatch = cleanIng.match(amountRegex);
      
      if (amountMatch) {
        amount = amountMatch[0].trim();
        remaining = cleanIng.slice(amountMatch[0].length).trim();
      } else {
        // 2. Check for amount in parentheses at the end: "Item (Amount)"
        const trailingAmountRegex = /\s*\(([^)]+)\)$/;
        const trailingMatch = cleanIng.match(trailingAmountRegex);
        if (trailingMatch) {
          amount = trailingMatch[1].trim();
          remaining = cleanIng.replace(trailingAmountRegex, '').trim();
        } else {
          // 3. Check for amount after a dash at the end: "Item - Amount"
          const dashAmountRegex = /\s*-\s*([\d\/\s.-]+)$/;
          const dashMatch = cleanIng.match(dashAmountRegex);
          if (dashMatch) {
            amount = dashMatch[1].trim();
            remaining = cleanIng.replace(dashAmountRegex, '').trim();
          } else {
            // 4. Check for trailing amount/unit: "Item 17.64 oz"
            const trailingUnitRegex = /\s+(\d*\.\d+|\d+)\s*([a-zA-Z]+(?:\.[a-zA-Z]+)*)?$/;
            const trailingUnitMatch = cleanIng.match(trailingUnitRegex);
            if (trailingUnitMatch) {
              const possibleAmount = trailingUnitMatch[1];
              const possibleUnit = trailingUnitMatch[2] || '';
              const possibleUnitClean = possibleUnit.toLowerCase().replace(/[^a-z]/g, '');
              
              if (possibleUnitClean === '' || commonUnits.includes(possibleUnitClean)) {
                amount = possibleAmount;
                unit = possibleUnit;
                remaining = cleanIng.replace(trailingUnitRegex, '').trim();
              }
            }
          }
        }
      }

      const extraAmountRegex = /^([\s-–—]*[\d\/]+|[\s-–—]*[\u00BC-\u00BE\u2150-\u215E])/;
      const extraMatch = remaining.match(extraAmountRegex);
      if (extraMatch && amount && (!isNaN(parseInt(amount[0])) || /[\u00BC-\u00BE\u2150-\u215E]/.test(amount[0]))) {
        amount = (amount + extraMatch[0]).trim();
        remaining = remaining.slice(extraMatch[0].length).trim();
      }

      const words = remaining.split(' ');
      let item = remaining;

      if (words.length > 0) {
        if (words.length > 1) {
          const twoWordsClean = (words[0] + words[1]).toLowerCase().replace(/[^a-z]/g, '');
          if (commonUnits.includes(twoWordsClean)) {
            unit = words[0] + ' ' + words[1];
            item = words.slice(2).join(' ');
          }
        }

        if (!unit) {
          const firstWordClean = words[0].toLowerCase().replace(/[^a-z]/g, '');
          if (commonUnits.includes(firstWordClean)) {
            unit = words[0];
            item = words.slice(1).join(' ');
          } else if (words.length > 1) {
            const secondWordClean = words[1].toLowerCase().replace(/[^a-z]/g, '');
            if (commonUnits.includes(secondWordClean)) {
              const isFirstWordNumeric = /^([\d\/]+|[\u00BC-\u00BE\u2150-\u215E])$/.test(words[0]);
              if (!isFirstWordNumeric) {
                unit = words[0] + ' ' + words[1];
                item = words.slice(2).join(' ');
              } else {
                amount = (amount + ' ' + words[0]).trim();
                unit = words[1];
                item = words.slice(2).join(' ');
              }
            }
          }
        }
      }

      if (unit.toLowerCase().includes('leave') && item.toLowerCase().startsWith('curry')) {
        item = unit + ' ' + item;
        unit = '';
      }

      let finalItem = (item || remaining || 'Unknown Item').trim();
      
      // Clean up trailing parenthetical info if it's just a redundant amount
      finalItem = finalItem.replace(/\s*\(\s*\d+.*\)\s*$/, '').trim();
      // Clean up double parentheses noise
      finalItem = finalItem.replace(/\s*\(\s*\(\s*(.*?)\s*\)\s*\)\s*$/, ' ($1)').trim();

      const weirdParenRegex = /^(.+?)\s*\(\s*,\s*(.+)\)$/;
      const parenMatch = finalItem.match(weirdParenRegex);
      if (parenMatch) {
        finalItem = `${parenMatch[1].trim()}, ${parenMatch[2].trim()}`;
      }

      return {
        item: finalItem,
        amount: amount || '',
        unit: unit || ''
      };
    };

    const parseSteps = (instructions: any): string[] => {
      if (!instructions) return [];
      
      const splitText = (text: string): string[] => {
        const decoded = decodeHtml(text);
        // Split by newlines first
        let parts = decoded.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
        
        // If we still have only one part, check for other delimiters
        if (parts.length === 1) {
          const content = parts[0];
          // 1. Check for numbered lists in a single line: "1. ... 2. ... 3. ..."
          const numberedMatch = content.match(/\d+\.\s+[A-Z]/g);
          if (numberedMatch && numberedMatch.length > 1) {
            return content.split(/(?=\d+\.\s+[A-Z])/).map(p => p.trim()).filter(Boolean);
          }

          // 2. Check for sentence-based splitting if it's a long block
          if (content.length > 100) {
            // Split by period, exclamation, or question mark followed by space
            // Using lookbehind to keep the punctuation with the sentence
            const sentences = content.split(/(?<=[.!?])\s+/).map(p => p.trim()).filter(Boolean);
            if (sentences.length > 1) return sentences;
          }
        }
        return parts;
      };

      if (typeof instructions === 'string') return splitText(instructions);
      
      if (Array.isArray(instructions)) {
        let steps: string[] = [];
        instructions.forEach(item => {
          if (typeof item === 'string') {
            steps = [...steps, ...splitText(item)];
          } else if (item.text) {
            steps = [...steps, ...splitText(item.text)];
          } else if (item.itemListElement && Array.isArray(item.itemListElement)) {
            if (item.name) {
              steps.push(`[SECTION]: ${decodeHtml(item.name)}`);
            }
            steps = [...steps, ...parseSteps(item.itemListElement)];
          } else if (item.name && !item.itemListElement) {
            steps.push(decodeHtml(item.name));
          }
        });
        return steps;
      }

      if (typeof instructions === 'object') {
        if (instructions.text) return splitText(instructions.text);
        if (instructions.itemListElement) {
          let steps: string[] = [];
          if (instructions.name) {
            steps.push(`[SECTION]: ${decodeHtml(instructions.name)}`);
          }
          return [...steps, ...parseSteps(instructions.itemListElement)];
        }
      }
      
      return [];
    };

    let ingredients: any[] = [];
    let steps: string[] = [];
    let title = '';

    // 1. Try to extract from HTML first for better structure (headers)
    const wprmGroups = $('.wprm-recipe-ingredient-group');
    if (wprmGroups.length > 0) {
      wprmGroups.each((_, group) => {
        const groupName = $(group).find('.wprm-recipe-ingredient-group-name').text().trim();
        if (groupName) {
          ingredients.push({ item: groupName, amount: '', unit: '', isHeader: true });
        }
        $(group).find('.wprm-recipe-ingredient').each((_, ing) => {
          const amount = $(ing).find('.wprm-recipe-ingredient-amount').text().trim();
          const unit = $(ing).find('.wprm-recipe-ingredient-unit').text().trim();
          const name = $(ing).find('.wprm-recipe-ingredient-name').text().trim();
          const notes = $(ing).find('.wprm-recipe-ingredient-notes').text().trim();
          
          if (name || amount || unit) {
            ingredients.push({
              item: name + (notes ? ` ${notes}` : ''),
              amount: amount,
              unit: unit
            });
          } else {
            ingredients.push(parseIngredient($(ing).text()));
          }
        });
      });

      $('.wprm-recipe-instruction-group').each((_, group) => {
        const groupName = $(group).find('.wprm-recipe-instruction-group-name').text().trim();
        if (groupName) {
          steps.push(`[SECTION]: ${groupName}`);
        }
        $(group).find('.wprm-recipe-instruction').each((_, ins) => {
          steps.push(decodeHtml($(ins).text().trim()));
        });
      });
      
      title = $('.wprm-recipe-name').text().trim();
    }

    // Generic extraction if WPRM failed
    if (ingredients.length === 0) {
      const ingredientSelectors = [
        '.ingredients-list li',
        '.recipe-ingredients li',
        '.ingredients li',
        '[class*="ingredients"] li',
        '.recipe-ingreds li'
      ];
      
      for (const selector of ingredientSelectors) {
        const found = $(selector);
        if (found.length > 0) {
          found.each((_, el) => {
            const text = $(el).text().trim();
            if (text) ingredients.push(parseIngredient(text));
          });
          break;
        }
      }
    }

    if (steps.length === 0) {
      const stepSelectors = [
        '.method_item .description',
        '.method_item',
        '.instructions-list li',
        '.recipe-instructions li',
        '.instructions li',
        '[class*="instructions"] li',
        '.recipe-steps li',
        '.method li',
        '[class*="method"] li',
        '.recipe-method p',
        '.method p',
        '.instructions p'
      ];

      for (const selector of stepSelectors) {
        const found = $(selector);
        if (found.length > 0) {
          found.each((_, el) => {
            const text = $(el).text().trim();
            if (text) steps.push(decodeHtml(text));
          });
          break;
        }
      }
    }

    if (!title) {
      title = $('h1').first().text().trim() || $('.recipe-title').text().trim() || $('[class*="title"]').first().text().trim();
    }

    // 2. Fallback to JSON-LD if HTML extraction failed or to fill gaps
    if (recipeData) {
      if (!title) title = decodeHtml(recipeData.name);
      
      if (ingredients.length === 0) {
        ingredients = (recipeData.recipeIngredient || []).map(parseIngredient);
      }
      
      if (steps.length === 0) {
        steps = parseSteps(recipeData.recipeInstructions);
      }
    }

    if (ingredients.length === 0 && steps.length === 0) {
      console.log('[Import] Standard extraction failed, preparing raw text for AI');
      // If standard extraction fails, return the raw text so the frontend can use Gemini
      const clone = $('body').clone();
      clone.find('script, style, noscript, iframe, svg, nav, footer, header').remove();
      const pageText = clone.text().replace(/\s+/g, ' ').trim().substring(0, 15000);
      
      return res.json({ 
        needsAI: true, 
        rawText: pageText,
        title: decodeHtml(title) || 'Imported Recipe'
      });
    }

    console.log(`[Import] Success! Extracted ${ingredients.length} ingredients and ${steps.length} steps.`);

    res.json({
      title: decodeHtml(title) || 'Imported Recipe',
      ingredients,
      steps: steps.filter(Boolean),
      prep_time: parseDuration(recipeData?.prepTime),
      cook_time: parseDuration(recipeData?.cookTime),
      servings: decodeHtml(Array.isArray(recipeData?.recipeYield) ? recipeData.recipeYield[0] : recipeData?.recipeYield),
      cuisine: decodeHtml(Array.isArray(recipeData?.recipeCuisine) ? recipeData.recipeCuisine[0] : recipeData?.recipeCuisine),
      course: decodeHtml(Array.isArray(recipeData?.recipeCategory) ? recipeData.recipeCategory[0] : recipeData?.recipeCategory),
      keywords: typeof recipeData?.keywords === 'string' 
        ? recipeData.keywords.split(',').map((k: string) => decodeHtml(k.trim())) 
        : (Array.isArray(recipeData?.keywords) ? recipeData.keywords.map((k: any) => decodeHtml(String(k))) : []),
      notes: null // Keep notes empty as requested
    });
  } catch (error: any) {
    console.error('Import error:', error.message);
    if (error.response) {
      if (error.response.status === 403) {
        return res.status(403).json({ error: 'Access Forbidden (403). This website is blocking automated recipe extraction. You may need to copy-paste the recipe manually.' });
      }
      if (error.response.status === 404) {
        return res.status(404).json({ error: 'Recipe page not found (404).' });
      }
    }
    res.status(500).json({ error: `Import failed: ${error.message}` });
  }
});

// Sitemap route
app.get('/sitemap.xml', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/explore</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

let isConfigured = false;

export async function createServer() {
  if (isConfigured) return app;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Failed to load Vite:', e);
    }
  } else if (process.env.VERCEL !== '1') {
    // Only serve static files if NOT on Vercel (Vercel handles this via vercel.json/edge)
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  isConfigured = true;
  return app;
}

// Only start the server if this file is run directly and not on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
const isMain = process.argv[1] && (
  import.meta.url.includes(path.basename(process.argv[1])) ||
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.js')
);

if (isMain && !isVercel) {
  createServer().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

export default app;
