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
  cleanIng = cleanIng.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '');
  let amount = '';
  let remaining = cleanIng;
  let unit = '';
  const amountRegex = /^(\d+\s+to\s+\d+|\d+[\s-–—]+\d+|\d+\s+[\d\/]+|\d+[\u00BC-\u00BE\u2150-\u215E]|[\d\/]+|[\u00BC-\u00BE\u2150-\u215E]|[\u00BC-\u00BE\u2150-\u215E][\s-–—]+[\u00BC-\u00BE\u2150-\u215E]|\d+[\s-–—]+[\u00BC-\u00BE\u2150-\u215E]|\d*\.\d+|\d+|[Aa]\s+few|[Ss]ome|[Tt]o\s+taste)/;
  const amountMatch = cleanIng.match(amountRegex);
  if (amountMatch) {
    amount = amountMatch[0].trim();
    remaining = cleanIng.slice(amountMatch[0].length).trim();
  }
  const words = remaining.split(' ');
  let item = remaining;
  // Simple unit detection
  const commonUnits = ['grams', 'gram', 'g', 'kg', 'cup', 'cups', 'tsp', 'teaspoon', 'tbsp', 'tablespoon', 'ml', 'oz', 'ounce', 'lb', 'pound'];
  if (words.length > 0) {
    const firstWordClean = words[0].toLowerCase().replace(/[^a-z]/g, '');
    if (commonUnits.includes(firstWordClean)) {
      unit = words[0];
      item = words.slice(1).join(' ');
    }
  }
  return { item: item.trim(), amount: amount || '', unit: unit || '' };
};

const parseSteps = (instructions: any): string[] => {
  if (!instructions) return [];
  if (typeof instructions === 'string') return [decodeHtml(instructions)];
  if (Array.isArray(instructions)) {
    return instructions.flatMap(item => {
      if (typeof item === 'string') return [decodeHtml(item)];
      if (item.text) return [decodeHtml(item.text)];
      if (item.itemListElement) return parseSteps(item.itemListElement);
      return [];
    });
  }
  if (typeof instructions === 'object') {
    if (instructions.text) return [decodeHtml(instructions.text)];
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
