import express from 'express';
import path from 'path';
import * as cheerio from 'cheerio';
import axios from 'axios';

const app = express();

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

// API Route for importing recipes
app.post('/api/import', async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    };

    let html: string;
    try {
      const response = await axios.get(url, { headers, timeout: 5000 });
      html = response.data;
    } catch (e) {
      // Try proxy if direct fetch fails
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, { timeout: 5000 });
      html = response.data;
    }

    if (!html) throw new Error('Failed to fetch website content');
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
