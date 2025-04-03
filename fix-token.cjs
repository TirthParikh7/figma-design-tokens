const fs = require("fs");

// Read JSON file (Assuming tokens.json is the raw export from Figma)
const rawData = fs.readFileSync("tokens.json", "utf-8");
let tokens = JSON.parse(rawData);

// Function to recursively update references
const updateReferences = (obj, prefix = "base") => {
  if (typeof obj !== "object" || obj === null) return;

  for (const key in obj) {
    if (typeof obj[key] === "object") {
      updateReferences(obj[key], prefix); // Recurse into objects
    } else if (typeof obj[key] === "string") {
      // Fix reference errors
      obj[key] = obj[key]
        .replace(/{color\./g, `{base.color.`)
        .replace(/{spacing\./g, `{base.spacing.`)
        .replace(/{button\.default\.backgroundColor}/g, `{base.button.default.backgroundColor}`);
    }
  }
};

// Fix incorrect types
const fixTypes = (obj) => {
  if (typeof obj !== "object" || obj === null) return;

  for (const key in obj) {
    if (typeof obj[key] === "object") {
      fixTypes(obj[key]);
    }

    if (key === "fontSize" && typeof obj[key].value === "object") {
      obj[key].value = "16px"; // Fix fontSize issue
      obj[key].type = "sizing";
    }

    if (key === "padding" && obj[key].type === "sizing") {
      obj[key].type = "spacing"; // Fix incorrect "sizing" type for spacing
    }
  }
};

// Apply fixes
updateReferences(tokens);
fixTypes(tokens);

// Save fixed JSON
fs.writeFileSync("fixed-tokens.json", JSON.stringify(tokens, null, 2));

console.log("✅ Tokens fixed and saved to fixed-tokens.json");
