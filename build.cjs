const StyleDictionaryPackage = require('style-dictionary');

// HAVE THE STYLE DICTIONARY CONFIG DYNAMICALLY GENERATED

StyleDictionaryPackage.registerFormat({
  name: 'css/variables',
  formatter: function (dictionary, config) {
    const processToken = (prop, prefix = '') => {
      if (typeof prop.value === 'object' && prop.value !== null) {
        return Object.entries(prop.value)
          .map(([subKey, subValue]) => processToken({ name: `${prop.name}-${subKey}`, value: subValue }, prefix))
          .join('\n');
      } else {
        return `  --${prefix}${prop.name}: ${prop.value};`;
      }
    };

    return `${this.selector} {\n${dictionary.allProperties.map(prop => processToken(prop)).join('\n')}\n}`;
  }
});
 

//

function kebabIt(str) {
    return str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .join('-')
        .toLowerCase();
  }

  function getBasePxFontSize(options) {
  return (options && options.basePxFontSize) || 16;
}

function fontPxToRem(token, options) {
  const baseFont = getBasePxFontSize(options);
  const floatVal = parseFloat(token.value);
  if (isNaN(floatVal)) {
    console.log('NaN error', token.name, token.value, 'rem');
  }
  if (floatVal === 0) {
    return '0';
  }
  return `${floatVal / baseFont}rem`;
}

StyleDictionaryPackage.registerTransform({
    name: 'size/pxToRem',
    type: 'value',
    matcher: (token) => ['fontSizes'].includes(token.type),
    transformer: (token, options) => fontPxToRem(token, options)
  })
// 
StyleDictionaryPackage.registerTransform({
    name: 'sizes/px',
    type: 'value',
    matcher: function(prop) {
        // You can be more specific here if you only want 'em' units for font sizes    
        return ["fontSize", "spacing", "borderRadius", "borderWidth", "sizing"].includes(prop.attributes.category);
    },
    transformer: function(prop) {
        // You can also modify the value here if you want to convert pixels to ems
        return parseFloat(prop.original.value) + 'px';
    }
    });

function getStyleDictionaryConfig(theme) {
  return {
    "source": [
      `./${theme}.json`,
    ],
    "platforms": {
      "web": {
        "transforms": 
          ["attribute/cti", "name/cti/kebab", "sizes/px", "size/pxToRem"],
        "buildPath": `output/`,
        "files": [{
            "destination": `${theme}.css`,
            "format": "css/variables",
            "selector": `.${theme}-theme`
          }]
      }
    }
  };
}

console.log('Build started...');

// PROCESS THE DESIGN TOKENS FOR THE DIFFEREN BRANDS AND PLATFORMS

['fixed-tokens'].map(function (theme) {

    console.log('\n==============================================');
    console.log(`\nProcessing: [${theme}]`);

    const StyleDictionary = StyleDictionaryPackage.extend(getStyleDictionaryConfig(theme));

    StyleDictionary.buildPlatform('web');

    console.log('\nEnd processing');
})

console.log('\n==============================================');
console.log('\nBuild completed!');



