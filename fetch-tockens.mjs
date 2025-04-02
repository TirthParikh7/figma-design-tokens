import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_ACCESS_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_API_URL = `https://api.figma.com/v1/files/${FIGMA_FILE_ID}`;
console.log(FIGMA_API_URL,FIGMA_FILE_ID,FIGMA_ACCESS_TOKEN)
async function fetchFigmaTokens() {
    try {
        console.log("🚀 Fetching raw tokens from Figma...");
        const response = await axios.get(FIGMA_API_URL, {
            headers: { 'X-Figma-Token': FIGMA_ACCESS_TOKEN }
        });
        console.log(response)
        fs.writeFileSync('input/raw-tokens.json', JSON.stringify(response.data, null, 2));
        console.log("✅ Raw tokens saved to input/raw-tokens.json");

    } catch (error) {
        console.error("❌ Error fetching tokens:", error);
    }
}

fetchFigmaTokens();
