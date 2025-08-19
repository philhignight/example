const fs = require('fs');
const path = require('path');
const YAMLParser = require('./yamlParser');

/**
 * Extracts Java system properties (-Dkey=value) from a command string
 * @param {string} command - The Java command string
 * @returns {string} Space-separated list of system properties
 */
function extractSystemProperties(command) {
  // Regular expression to match -Dkey=value patterns
  // Matches -D followed by non-whitespace characters until a space or end of string
  const regex = /-D[^\s]+/g;
  
  const matches = command.match(regex) || [];
  
  // Join all matches with spaces
  return matches.join(' ');
}

function processConfigFiles(folderPath) {
  const parser = new YAMLParser();
  
  // Read and parse the files
  const configmapPath = path.join(folderPath, 'configmap.yaml');
  const valuesPath = path.join(folderPath, 'values.yaml');
  
  if (!fs.existsSync(configmapPath)) {
    console.error(`Error: configmap.yaml not found at ${configmapPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(valuesPath)) {
    console.error(`Error: values.yaml not found at ${valuesPath}`);
    process.exit(1);
  }
  
  const configmapContent = fs.readFileSync(configmapPath, 'utf8');
  const valuesContent = fs.readFileSync(valuesPath, 'utf8');
  
  const configmap = parser.parse(configmapContent);
  const values = parser.parse(valuesContent);
  
  // Extract the data object from configmap
  const dataObj = configmap.data || {};
  console.log('Data object keys:', Object.keys(dataObj));
  
  // Extract the env array from values
  const envArray = values.env || [];
  console.log('Env array length:', envArray.length);
  
  // Extract the entrypoint string from values
  let entrypointString = values.entrypoint || '';
  console.log('Original entrypoint:', entrypointString);
  console.log('');
  
  // Get flat list of all configMapKeyRef keys from env array
  const envKeys = [];
  envArray.forEach(envItem => {
    if (envItem.valueFrom && 
        envItem.valueFrom.configMapKeyRef && 
        envItem.valueFrom.configMapKeyRef.key) {
      envKeys.push(envItem.valueFrom.configMapKeyRef.key);
    }
  });
  
  // Compare keys and report missing ones
  const dataKeys = Object.keys(dataObj);
  
  // Check for keys in data that aren't in env
  const missingInEnv = dataKeys.filter(key => !envKeys.includes(key));
  
  // Check for keys in env that aren't in data
  const missingInData = envKeys.filter(key => !dataKeys.includes(key));
  
  // Process replacements in entrypoint string
  console.log('Processing entrypoint replacements:');
  console.log('-----------------------------------');
  
  let processedEntrypoint = entrypointString;
  const replacements = [];
  
  // For each key/value in data object
  Object.entries(dataObj).forEach(([dataKey, dataValue]) => {
    // Find corresponding env item
    const envItem = envArray.find(item => 
      item.valueFrom && 
      item.valueFrom.configMapKeyRef && 
      item.valueFrom.configMapKeyRef.key === dataKey
    );
    
    if (envItem && envItem.name) {
      const finalKey = envItem.name; // The capitalized name from env
      const finalValue = dataValue;  // The value from data object
      const searchPattern = `$${finalKey}`;
      
      // Perform replacement
      if (processedEntrypoint.includes(searchPattern)) {
        processedEntrypoint = processedEntrypoint.replace(
          new RegExp(searchPattern.replace(/\$/g, '\\$'), 'g'), 
          finalValue
        );
        replacements.push({
          pattern: searchPattern,
          replacement: finalValue,
          dataKey: dataKey
        });
        console.log(`  Replaced "${searchPattern}" with "${finalValue}" (from data.${dataKey})`);
      }
    }
  });
  
  if (replacements.length === 0) {
    console.log('  No replacements made');
  }
  
  // Extract Java system properties (-Dkey=value) from the processed entrypoint
  const systemProperties = extractSystemProperties(processedEntrypoint);
  
  console.log('');
  console.log('Java System Properties:');
  console.log('=======================');
  console.log(systemProperties);
  
  // Report missing keys at the end
  if (missingInEnv.length > 0 || missingInData.length > 0) {
    console.log('');
    console.log('KEY VALIDATION ERRORS:');
    console.log('======================');
    
    if (missingInEnv.length > 0) {
      console.error('Keys present in configmap.data but missing in values.env:');
      missingInEnv.forEach(key => {
        console.error(`  - "${key}" is in configmap.data but not referenced in values.env`);
      });
    }
    
    if (missingInData.length > 0) {
      if (missingInEnv.length > 0) console.error('');
      console.error('Keys referenced in values.env but missing in configmap.data:');
      missingInData.forEach(key => {
        console.error(`  - "${key}" is referenced in values.env but not present in configmap.data`);
      });
    }
  }
}

// Get folder path from command line argument
const folderPath = process.argv[2];

if (!folderPath) {
  console.error('Usage: node process-config.js <folder-path>');
  console.error('Example: node process-config.js ./config');
  process.exit(1);
}

if (!fs.existsSync(folderPath)) {
  console.error(`Error: Folder not found: ${folderPath}`);
  process.exit(1);
}

processConfigFiles(folderPath);
