import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const OUTPUT_PATH = process.env.OUTPUT_PATH;

let lastModified = null;
let initialFetchDone = false;

// Fetch Figma File Updates
async function checkFigmaUpdates() {
    console.log("Checking for Figma updates...");
    try {
        const response = await axios.get(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });
       
        const modifiedDate = response.data.lastModified;


        if (!initialFetchDone) {
            console.log("Performing initial fetch...");
            initialFetchDone = true;
            await fetchDesignTokens(response.data);
        }
        console.log(lastModified,modifiedDate)
        if (lastModified !== modifiedDate) {
            console.log("Figma file updated! Fetching new tokens...");
            lastModified = modifiedDate;
            await fetchDesignTokens(response.data);
        }
    } catch (error) {
        console.error("Error checking Figma updates:", error);
    }
}

// Fetch and Process Design Tokens
async function fetchDesignTokens(figmaData) {
    try {
        const tokens = extractTokens(figmaData.document);

        fs.ensureDirSync(OUTPUT_PATH);
        fs.writeFileSync(path.join(OUTPUT_PATH, 'tokens.json'), JSON.stringify(tokens, null, 2));

        const cssVariables = generateCSS(tokens);
        fs.writeFileSync(path.join(OUTPUT_PATH, 'variables.css'), cssVariables);

        console.log("Tokens and CSS variables saved successfully!");
    } catch (error) {
        console.error("Error fetching tokens:", error);
    }
}

// Extract Design Tokens
function extractTokens(node) {
    const tokens = {
        colors: {},
        typography: {},
        spacing: {},
        shadows: {},
        borderRadius: {},
    };

    function traverse(node) {
        if (!node || !node.name) return;

        // Sanitize token names (remove emojis, long descriptions, spaces)
        const cleanName = node.name.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '-');

        if (node.fills && node.fills.length > 0 && node.fills[0].color) {
            tokens.colors[cleanName] = rgbaToHex(node.fills[0].color);
        }

        if (node.style) {
            if (node.style.fontSize) {
                tokens.typography[cleanName] = `${node.style.fontSize}px`;
            }
            if (node.style.letterSpacing) {
                tokens.spacing[cleanName] = `${node.style.letterSpacing}px`;
            }
            if (node.style.cornerRadius) {
                tokens.borderRadius[cleanName] = `${node.style.cornerRadius}px`;
            }
            if (node.effects && node.effects.length > 0) {
                tokens.shadows[cleanName] = JSON.stringify(node.effects);
            }
        }

        if (node.children) {
            node.children.forEach(traverse);
        }
    }

    traverse(node);
    return tokens;
}

// Convert RGBA to HEX
function rgbaToHex(color) {
    const { r, g, b, a } = color;
    const hex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return a === 1 ? `#${hex(r)}${hex(g)}${hex(b)}` : `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

// Generate CSS Variables
function generateCSS(tokens) {
    let css = ':root {\n';

    for (const category in tokens) {
        for (const key in tokens[category]) {
            const cssVar = `--${category}-${key}`;
            css += `  ${cssVar}: ${tokens[category][key]};\n`;
        }
    }

    css += '}\n';
    return css;
}

// Run Initial Fetch
async function initialFetch() {
    try {
        console.log("Fetching Figma data...");
        const response = await axios.get(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });

        await fetchDesignTokens(response.data);
        console.log("Initial fetch completed!");
    } catch (error) {
        console.error("Error performing initial fetch:", error);
    }
}

// Start Listening for Updates
initialFetch().then(() => setInterval(checkFigmaUpdates, 10 * 1000));
