const { transformTokens } = require('token-transformer');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');

// Load Figma Raw Tokens
const rawTokensPath = path.join(__dirname, 'input', 'raw-tokens.json');
let rawTokens;

try {
  const rawData = fs.readFileSync(rawTokensPath);
  rawTokens = JSON.parse(rawData);
} catch (error) {
  console.error('❌ Error reading raw tokens file:', error);
  process.exit(1);
}

// Convert RGBA to HEX
function rgbaToHex(color) {
  if (!color) return null;
  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Preprocess Figma tokens
function preprocessFigmaTokens(tokens) {
  return _.mapValues(tokens, (value) => {
    if (!value) return null;

    if (value.fills && Array.isArray(value.fills) && value.fills.length > 0) {
      return {
        type: 'color',
        value: rgbaToHex(value.fills[0].color),
      };
    }

    if (value.style) {
      return {
        type: 'typography',
        value: {
          fontFamily: value.style.fontFamily || 'default',
          fontSize: value.style.fontSize || 16,
          fontWeight: value.style.fontWeight || 400,
        },
      };
    }

    return value;
  });
}
// Preprocess raw tokens
const preprocessedTokens = preprocessFigmaTokens(rawTokens);
const outputPath = path.join(__dirname, 'output', 'preprocessed-tokens.json');
fs.writeFileSync(outputPath, JSON.stringify(preprocessedTokens, null, 2));


// Filter out null values before transformation
const cleanedTokens = _.pickBy(preprocessedTokens, (value) => value !== null);

// Use Token Transformer
try {
  const transformedTokens = transformTokens(cleanedTokens, {
    expandTypography: true,
    expandShadow: true,
    expandComposition: true,
    expandBorder: true,
    preserveRawValue: false,
    throwErrorWhenNotResolved: true,
    resolveReferences: true,
  });

  // Save to a new file
  const outputPath = path.join(__dirname, 'output', 'formatted-tokens.json');
  fs.writeFileSync(outputPath, JSON.stringify(transformedTokens, null, 2));

  console.log('✅ Transformation Complete! Check output/formatted-tokens.json');
} catch (error) {
  console.error('❌ Error during token transformation:', error);
}
