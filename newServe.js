
import fs from "fs"
 
// Load the raw Figma token JSON
const rawTokens = JSON.parse(fs.readFileSync("./input/raw-tokens.json", "utf-8"));
 
function extractColor(colorObj) {
    if (!colorObj) return null;
    return `#${Math.round(colorObj.r * 255).toString(16).padStart(2, "0")}${Math.round(colorObj.g * 255).toString(16).padStart(2, "0")}${Math.round(colorObj.b * 255).toString(16).padStart(2, "0")}`.toUpperCase();
}
 
function processTokens(node, variables = []) {
    if (!node) return variables;
 
    // Process colors
    if (node.name && node.fills && node.fills[0] && node.fills[0].color) {
        const color = extractColor(node.fills[0].color);
        if (color) {
            const key = node.name.toLowerCase().replace(/[^\w-]+/g, "-");
            variables.push(`  --color-${key}: ${color};`);
        }
    }
 
    // Process typography
    if (node.style) {
        const key = node.name.toLowerCase().replace(/[^\w-]+/g, "-");
        if (node.style.fontFamily) {
            variables.push(`  --typography-${key}-font-family: ${node.style.fontFamily};`);
        }
        if (node.style.fontSize) {
            variables.push(`  --typography-${key}-font-size: ${node.style.fontSize}px;`);
        }
        if (node.style.fontWeight) {
            variables.push(`  --typography-${key}-font-weight: ${node.style.fontWeight};`);
        }
    }
 
    // Process children
    if (node.children) {
        node.children.forEach(child => processTokens(child, variables));
    }
 
    return variables;
}
 
const cssVariables = processTokens(rawTokens.document);
 
// Create CSS theme
const cssTheme = `.figma-theme {\n${cssVariables.join('\n')}\n}`;
 
// Save the CSS
fs.writeFileSync("./theme.css", cssTheme);
 
console.log("✅ Conversion complete! Formatted tokens saved to formatted-tokens.json");