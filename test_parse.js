
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

const decodeHtml = (str) => str; // Mock for test

const parseIngredient = (ing) => {
    // Clean up the string and normalize spaces
    let cleanIng = decodeHtml(ing).trim().replace(/\s+/g, ' ');
    
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
      amount = (amount + ' ' + extraMatch[0]).trim();
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

const testCases = [
  "2-2 ⅓ cups all-purpose flour OR bread flour¹ (divided (250-295g))",
  "1 packet instant yeast² ((2 ¼ teaspoon))",
  "1 ½ teaspoons sugar",
  "¾ teaspoon salt",
  "⅛-¼ teaspoon garlic powder and/or dried basil leaves (optional)",
  "2 Tablespoons olive oil (+ additional )",
  "¾ cup  warm water³ ((175ml))"
];

testCases.forEach(tc => {
  console.log(`Input: ${tc}`);
  console.log(`Output:`, parseIngredient(tc));
  console.log('---');
});
