import axios from 'axios';
import * as cheerio from 'cheerio';

async function debug() {
  const url = 'https://www.chelsea.co.nz/recipes/browse-recipes/banana-cake';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    console.log('--- JSON-LD ---');
    $('script[type="application/ld+json"]').each((i, el) => {
      const content = $(el).html();
      if (!content) return;
      try {
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
          if (obj['@graph'] && Array.isArray(obj['@graph'])) return findRecipe(obj['@graph']);
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
              const found = findRecipe(obj[key]);
              if (found) return found;
            }
          }
          return null;
        };
        const recipe = findRecipe(json);
        if (recipe) {
          console.log('Recipe Instructions Type:', typeof recipe.recipeInstructions);
          console.log('Recipe Instructions:', JSON.stringify(recipe.recipeInstructions, null, 2));
        }
      } catch (e) {}
    });

    console.log('\n--- Method HTML ---');
    const method = $('.recipe-method, .method, [class*="method"]');
    console.log(method.html());
    
    console.log('\n--- Method Text ---');
    console.log(method.text());

  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

debug();
