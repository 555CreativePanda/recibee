
import axios from 'axios';
import * as cheerio from 'cheerio';

async function check() {
  const url = 'https://sugarspunrun.com/the-best-pizza-dough-recipe/';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      }
    });
    const $ = cheerio.load(response.data);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, element) => {
      const content = $(element).html();
      if (content && content.includes('recipeCuisine')) {
        console.log(content);
      }
    });
  } catch (e) {
    console.error(e);
  }
}
check();
