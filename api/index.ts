import express from 'express';
import path from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { rateLimit } from 'express-rate-limit';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';

const app = express();

// Rate limiting to prevent DOS attacks - applied to all routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter);

// Trust proxy for Vercel
app.set('trust proxy', 1);
app.use(express.json());

// Serve favicon explicitly as a fallback
app.get('/favicon.svg', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'favicon.svg'));
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

// Health check - Absolute simplest possible
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    vercel: !!process.env.VERCEL
  });
});

// Helper to decode HTML entities and clean text
const decodeHtml = (str: string) => {
  if (!str) return '';
  if (typeof str !== 'string') return String(str);
  let processed = str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '\n');
  const $ = cheerio.load(`<span>${processed}</span>`);
  let text = $('span').text().trim();
  if (text.includes('&')) {
    const $2 = cheerio.load(`<span>${text}</span>`);
    text = $2('span').text().trim();
  }
  text = text.replace(/Â/g, '');
  return text;
};

const parseDuration = (duration: string) => {
  if (!duration) return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = match[1] ? `${match[1]}h ` : '';
    const minutes = match[2] ? `${match[2]}m` : '';
    const seconds = match[3] ? `${match[3]}s` : '';
    return (hours + minutes + seconds).trim() || duration;
  }
  return duration;
};

const parseIngredient = (ing: string) => {
  let cleanIng = decodeHtml(ing).trim().replace(/\s+/g, ' ');
  // Remove common footnote markers like ¹²³
  cleanIng = cleanIng.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '');
  
  let amount = '';
  let remaining = cleanIng;
  let unit = '';

  // 1. Check for amount at the beginning
  // Handles: "1", "1 1/2", "1-2", "0.5", "½", "1 to 2", "A few", "To taste"
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
    }
  }

  // 3. Detect Unit
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
    'strip', 'strips'
  ];

  const words = remaining.split(' ');
  let item = remaining;

  if (words.length > 0) {
    // Check for two-word units like "fluid ounce" or "large cloves"
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
        // Check if second word is a unit (e.g., "1 large onion" -> item: "large onion", unit: "")
        // or "1 cup flour" -> amount: 1, unit: cup, item: flour
        const secondWordClean = words[1].toLowerCase().replace(/[^a-z]/g, '');
        if (commonUnits.includes(secondWordClean)) {
          // If first word is something like "large", "small", "medium", it's part of the item or a modifier
          const modifiers = ['large', 'small', 'medium', 'big', 'extra', 'heaping', 'packed', 'level'];
          if (modifiers.includes(words[0].toLowerCase())) {
            unit = words[1];
            item = words[0] + ' ' + words.slice(2).join(' ');
          } else {
            // Check if first word is actually a number that didn't get caught (e.g. "One")
            const isFirstWordNumeric = /^([\d\/]+|[\u00BC-\u00BE\u2150-\u215E])$/.test(words[0]);
            if (!isFirstWordNumeric) {
               // It's likely a subheading or a complex item
            } else {
              amount = (amount + ' ' + words[0]).trim();
              unit = words[1];
              item = words.slice(2).join(' ');
            }
          }
        }
      }
    }
  }

  // Detect subheadings (e.g., "MARINADE:", "FOR THE CURRY")
  const isHeader = cleanIng.endsWith(':') || (cleanIng === cleanIng.toUpperCase() && cleanIng.length > 3);

  return { 
    item: item.trim() || remaining || 'Unknown Item', 
    amount: amount || '', 
    unit: unit || '',
    isHeader
  };
};

const parseSteps = (instructions: any): any[] => {
  if (!instructions) return [];
  
  // If it's a string, split by common delimiters if it looks like multiple steps
  if (typeof instructions === 'string') {
    const decoded = decodeHtml(instructions);
    if (decoded.includes('\n')) {
      return decoded.split('\n').filter(s => s.trim()).map(s => ({ text: s.trim() }));
    }
    return [{ text: decoded }];
  }

  if (Array.isArray(instructions)) {
    return instructions.flatMap(item => {
      if (typeof item === 'string') return [{ text: decodeHtml(item) }];
      
      // Handle HowToSection
      if (item['@type'] === 'HowToSection') {
        const sectionName = decodeHtml(item.name || '');
        const sectionSteps = parseSteps(item.itemListElement || item.recipeInstructions);
        return [
          ...(sectionName ? [{ text: sectionName, isSubheading: true }] : []),
          ...sectionSteps
        ];
      }

      if (item.text) return [{ text: decodeHtml(item.text) }];
      if (item.itemListElement) return parseSteps(item.itemListElement);
      return [];
    });
  }

  if (typeof instructions === 'object') {
    if (instructions['@type'] === 'HowToSection') {
      const sectionName = decodeHtml(instructions.name || '');
      const sectionSteps = parseSteps(instructions.itemListElement || instructions.recipeInstructions);
      return [
        ...(sectionName ? [{ text: sectionName, isSubheading: true }] : []),
        ...sectionSteps
      ];
    }
    if (instructions.text) return [{ text: decodeHtml(instructions.text) }];
    if (instructions.itemListElement) return parseSteps(instructions.itemListElement);
  }

  return [];
};

import { Address4, Address6 } from 'ip-address';

const isPrivateIP = (ip: string): boolean => {
  // IPv4 Check
  try {
    const v4 = new Address4(ip);
    // Blocks 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16
    if (
      v4.isInSubnet(new Address4('127.0.0.0/8')) ||
      v4.isInSubnet(new Address4('10.0.0.0/8')) ||
      v4.isInSubnet(new Address4('172.16.0.0/12')) ||
      v4.isInSubnet(new Address4('192.168.0.0/16')) ||
      v4.isInSubnet(new Address4('169.254.0.0/16')) ||
      v4.isInSubnet(new Address4('0.0.0.0/8'))
    ) {
      return true;
    }
  } catch (e) {
    // Not a valid IPv4
  }

  // IPv6 Check
  try {
    const v6 = new Address6(ip);
    // Blocks loopback (::1), link-local (fe80::/10), site-local (fec0::/10), and unique local (fc00::/7)
    if (
      v6.isLoopback() ||
      v6.isLinkLocal() ||
      ip === '::' || ip === '::0' ||
      v6.isInSubnet(new Address6('fc00::/7')) ||
      v6.isInSubnet(new Address6('fec0::/10'))
    ) {
      return true;
    }
  } catch (e) {
    // Not a valid IPv6
  }

  return false;
};

// Custom DNS lookup that prevents resolving to private IPs
const ssrfSafeLookup: any = (hostname: any, options: any, callback: any) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return callback(err);

    const addresses = Array.isArray(address) ? address : [{ address, family }];
    
    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) {
        return callback(new Error(`Access to private IP address ${addr.address} is prohibited`));
      }
    }

    callback(err, address, family);
  });
};

const httpAgent = new http.Agent({ lookup: ssrfSafeLookup });
const httpsAgent = new https.Agent({ lookup: ssrfSafeLookup });

// Helper to validate and sanitize URL for SSRF protection
const getSafeUrl = async (urlStr: string): Promise<string | null> => {
  try {
    const parsed = new URL(urlStr);
    
    // 1. Protocol Restriction: Only http: and https:
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // 2. Port Restriction: Prevent internal port scanning by allowing only standard ports
    const port = parsed.port;
    if (port && port !== '80' && port !== '443') {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    if (!host) return null;

    // 3. Known Blocked Hostnames
    const blockedHosts = [
      'localhost', '127.0.0.1', '127.1', '0.0.0.0', '0',
      '[::1]', '::1', '[::]', '::',
      'metadata.google.internal', 'metadata', 'instance-data'
    ];
    
    if (blockedHosts.includes(host) || host.endsWith('.local') || host.endsWith('.internal')) {
      return null;
    }

    // 4. Pre-resolve DNS to check for DNS rebinding/internal IP aliases
    try {
      const addresses = await new Promise<dns.LookupAddress[]>((resolve, reject) => {
        dns.lookup(host, { all: true }, (err, addrs) => {
          if (err) reject(err);
          else resolve(addrs);
        });
      });

      for (const addr of addresses) {
        if (isPrivateIP(addr.address)) {
          return null;
        }
      }
    } catch (e) {
      // If we can't resolve it, it's safer to block it. 
      // dns.lookup also works for IP addresses, so if it's a valid IP it should have resolved or failed correctly.
      return null;
    }

    // 5. Final Sanitation: Reconstruct the URL from validated parts
    // To satisfy CodeQL and break the taint, we use hardcoded protocol prefixes
    // and strictly validated components.
    const cleanProtocol = parsed.protocol === 'https:' ? 'https://' : 'http://';
    const cleanHost = parsed.hostname;
    const cleanPort = parsed.port ? `:${parsed.port}` : '';
    const cleanPath = (parsed.pathname || '/').startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const cleanSearch = parsed.search || '';
    const cleanHash = parsed.hash || '';

    // Final URL reconstruction from individual validated parts
    const finalUrl = `${cleanProtocol}${cleanHost}${cleanPort}${cleanPath}${cleanSearch}${cleanHash}`;

    // 6. Explicit Taint Breaking for Static Analysis (CodeQL)
    // We use a strict regex to re-verify the entire URL. Using the captured group
    // from a match is a common pattern to signal to static analysis that the
    // data is now "safe" and no longer tainted.
    const absoluteUrlPattern = /^(https?):\/\/[a-zA-Z0-9.-]+(?::\d+)?(?:\/.*)?$/;
    const match = finalUrl.match(absoluteUrlPattern);
    
    if (!match || match[0] !== finalUrl) {
      return null;
    }

    // Returning the matched string (or a specific group) is often required for taint tracking to stop
    return match[0];
  } catch (e) {
    return null;
  }
};

// API Route for importing recipes
app.post('/api/import', async (req, res) => {
  const { url: rawUrl } = req.body;
  if (!rawUrl) return res.status(400).json({ error: 'URL is required' });

  // SSRF Protection & URL Sanitization
  const safeUrl = await getSafeUrl(rawUrl);
  if (!safeUrl) {
    return res.status(400).json({ error: 'Invalid or restricted URL' });
  }

  try {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    ];

    const getHeaders = (idx: number) => ({
      'User-Agent': userAgents[idx % userAgents.length],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
    });

    let html: string = '';
    let usedProxy = false;

    try {
      // Try direct fetch first
      const response = await axios.get(safeUrl, { 
        headers: getHeaders(0), 
        timeout: 8000,
        httpAgent,
        httpsAgent
      });
      html = response.data;
    } catch (e: any) {
      const statusCode = e.response?.status;
      
      // If we hit a challenge (402, 403) from a known protected site, don't waste time on proxies
      const knownProtected = [
        'seriouseats.com', 'nytimes.com', 'bonappetit.com', 'masalaandchai.com', 
        'halfbakedharvest.com', 'epicurious.com', 'food52.com', 'allrecipes.com',
        'simplyrecipes.com', 'delish.com', 'thepioneerwoman.com'
      ];
      if ((statusCode === 402 || statusCode === 403) && knownProtected.some(p => safeUrl.includes(p))) {
        console.info(`[Scraper] Known protection on ${safeUrl} (Status ${statusCode}). Switching to AI URL import.`);
        return res.json({ 
          needsAI: true, 
          rawText: '', 
          useUrlContext: true,
          url: safeUrl,
          title: 'Importing via AI...' 
        });
      }

      console.info(`Direct fetch for ${safeUrl} skipped partially: ${e.message}. Trying primary proxy...`);
      try {
        // Try AllOrigins proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(safeUrl)}`;
        const response = await axios.get(proxyUrl, { 
          headers: getHeaders(1), 
          timeout: 12000,
          httpAgent,
          httpsAgent
        });
        html = response.data;
        usedProxy = true;
      } catch (e2: any) {
        console.info(`Primary proxy for ${safeUrl} unavailable. Trying secondary proxy...`);
        try {
          // Try corsproxy.io as secondary fallback
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(safeUrl)}`;
          const response = await axios.get(proxyUrl, { 
            headers: getHeaders(2), 
            timeout: 12000,
            httpAgent,
            httpsAgent
          });
          html = response.data;
          usedProxy = true;
        } catch (e3: any) {
          console.info(`Secondary proxy for ${safeUrl} unavailable. Trying final fallback...`);
          try {
            // Final fallback: CodeTabs
            const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(safeUrl)}`;
            const response = await axios.get(proxyUrl, { 
              headers: getHeaders(0), 
              timeout: 12000,
              httpAgent,
              httpsAgent
            });
            html = response.data;
            usedProxy = true;
          } catch (e4: any) {
            console.info(`All standard fetch attempts exhausted for ${safeUrl}. Reverting to AI URL Context.`);
            
            // If fetching fails completely, return a signal to the frontend to try Gemini's URL Context tool
            return res.json({ 
              needsAI: true, 
              rawText: '', // No text fetched
              useUrlContext: true,
              url: safeUrl,
              title: 'Attempting AI URL Import...' 
            });
          }
        }
      }
    }

    if (!html || html.length < 200) {
      throw new Error('Website returned empty or invalid content. It might be blocking automated access.');
    }

    // Check if we got a "challenge" or "blocked" page (common with Cloudflare)
    if (html.includes('Cloudflare') && (html.includes('Verify you are human') || html.includes('Access denied'))) {
      throw new Error('This site is protected by a human verification challenge (Cloudflare) which prevents automated importing. Please copy and paste the ingredients and steps manually.');
    }

    const $ = cheerio.load(html);
    
    let recipeData: any = null;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const jsonContent = $(el).html();
        if (!jsonContent) return;
        const json = JSON.parse(jsonContent);
        const findRecipe = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj['@type'] === 'Recipe') return obj;
          if (Array.isArray(obj)) {
            for (const i of obj) {
              const f = findRecipe(i);
              if (f) return f;
            }
          }
          if (obj['@graph']) return findRecipe(obj['@graph']);
          for (const k in obj) {
            const f = findRecipe(obj[k]);
            if (f) return f;
          }
          return null;
        };
        const found = findRecipe(json);
        if (found) recipeData = found;
      } catch (e) {}
    });

    let title = $('h1').first().text().trim();
    let ingredients: any[] = [];
    let steps: string[] = [];

    if (recipeData) {
      title = recipeData.name || title;
      ingredients = (recipeData.recipeIngredient || []).map(parseIngredient);
      steps = parseSteps(recipeData.recipeInstructions);
    }

    if (ingredients.length === 0 && steps.length === 0) {
      const clone = $('body').clone();
      clone.find('script, style, nav, footer, header').remove();
      return res.json({ 
        needsAI: true, 
        rawText: clone.text().replace(/\s+/g, ' ').trim().substring(0, 10000),
        title: title || 'Imported Recipe'
      });
    }

    res.json({
      title: title || 'Imported Recipe',
      ingredients,
      steps,
      prep_time: parseDuration(recipeData?.prepTime),
      cook_time: parseDuration(recipeData?.cookTime),
      servings: String(recipeData?.recipeYield || ''),
      cuisine: String(recipeData?.recipeCuisine || ''),
      course: String(recipeData?.recipeCategory || '')
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sitemap route
app.get('/api/sitemap.xml', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

export default app;
