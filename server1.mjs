import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

dotenv.config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const OUTPUT_PATH = process.env.OUTPUT_PATH;

let lastModified = null;
let initialFetchDone = false;  // Flag to track if the initial fetch has been done

// Fetch Figma File Updates
async function checkFigmaUpdates() {
    console.log("Listening for Figma updates...");
    console.log(count++);
    try {
        const response = await axios.get(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });
        const modifiedDate = response.headers['last-modified'];
        
        // First-time build
        if (!initialFetchDone) {
            console.log("No previous record of Figma updates. Performing initial fetch...");
            initialFetchDone = true;
            await fetchDesignTokens(response.data);
        }

        // Check if the file has been updated
        if (lastModified !== modifiedDate) {
            console.log("Figma file updated! Fetching new tokens...");
            lastModified = modifiedDate;

            await fetchDesignTokens(response.data);
        }
    } catch (error) {
        console.error("Error checking Figma updates:", error);
    }
}

async function fetchDesignTokens(figmaData) {
    try {
        const tokenJson = JSON.stringify(figmaData, null, 2);
        fs.writeFileSync(path.join(OUTPUT_PATH, 'tokens.json'), tokenJson);
        const tokens = processFigmaData(figmaData);

        // Ensure the tokens directory exists
        fs.ensureDirSync(path.join(OUTPUT_PATH, 'css'));

        // Write the raw tokens as JSON file

        console.log("Design tokens saved as tokens.json!");

        // Write the CSS variables based on the tokens
        const cssVariables = generateCSS(tokens);
        fs.writeFileSync(path.join(OUTPUT_PATH, 'css', 'variables.css'), cssVariables);

        console.log("Design tokens saved as variables.css!");

    } catch (error) {
        console.error("Error fetching tokens:", error);
    }
}

// Process Figma Data and Extract Tokens
function processFigmaData(data) {
    const tokens = {};

    // Check if the styles data exists before proceeding
    if (!data.styles) {
        console.error('No styles found in Figma data.');
        return tokens;
    }

    const styles = data.styles; // This is an object where each key is a style ID

    // Iterate over the styles and extract tokens
    for (let key in styles) {
        const style = styles[key];

        if (style.styleType === 'FILL') {
            // This is a color token
            const colorName = style.name;

            // Assuming that color is being represented as a color object like { r, g, b, a }
            if (style.paints && style.paints[0] && style.paints[0].color) {
                const { r, g, b, a } = style.paints[0].color;
                const hexColor = rgbaToHex(r, g, b, a); // Convert RGBA to HEX or RGBA format

                tokens.colors = tokens.colors || {};
                tokens.colors[colorName] = hexColor;
            }
        }
        // Additional token types (like typography, spacing) can be handled here
    }

    return tokens;
}

// Convert RGBA color to HEX format
function rgbaToHex(r, g, b, a) {
    const hex = (x) => {
        const hexVal = Math.round(x * 255).toString(16);
        return hexVal.length === 1 ? '0' + hexVal : hexVal;
    };

    // If the alpha channel is 1 (fully opaque), return a HEX color
    if (a === 1) {
        return `#${hex(r)}${hex(g)}${hex(b)}`;
    }

    // Otherwise, return an RGBA format
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
}

// Convert the tokens to CSS variables format
function generateCSS(tokens) {
    let css = '';
    for (const category in tokens) {
        for (const key in tokens[category]) {
            const value = tokens[category][key];
            const cssKey = `--${category}-${key}`;
            css += `${cssKey}: ${value};\n`;
        }
    }
    return css;
}

// Perform initial fetch and start interval for continuous updates
async function initialFetch() {
    try {
        console.log("Performing initial fetch...");
        const response = await axios.get(`https://api.figma.com/v1/files/${FIGMA_FILE_ID}`, {
            headers: { 'X-Figma-Token': FIGMA_TOKEN }
        });
        console.log(response.data,"tirth")

        await fetchDesignTokens(response.data);
        console.log("Initial fetch completed!");
    } catch (error) {
        console.error("Error performing initial fetch:", error);
    }
}
var count=0;

// Run the initial fetch before starting the update check
initialFetch().then(() => {
    // Start interval to check for Figma updates every 60 seconds
    
    setInterval(checkFigmaUpdates, 60 * 1000);
    console.log("Listening for Figma updates...");
    console.log(count++);
});
