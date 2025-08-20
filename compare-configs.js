const fs = require('fs');
const path = require('path');
const YAMLParser = require('./yamlParser');

/**
 * Reads and parses configmap and values files from a directory
 */
function readConfigFiles(folderPath) {
  const parser = new YAMLParser();
  
  const configmapPath = path.join(folderPath, 'configmap.yaml');
  const valuesPath = path.join(folderPath, 'values.yaml');
  
  if (!fs.existsSync(configmapPath)) {
    throw new Error(`configmap.yaml not found at ${configmapPath}`);
  }
  
  if (!fs.existsSync(valuesPath)) {
    throw new Error(`values.yaml not found at ${valuesPath}`);
  }
  
  const configmapContent = fs.readFileSync(configmapPath, 'utf8');
  const valuesContent = fs.readFileSync(valuesPath, 'utf8');
  
  const configmap = parser.parse(configmapContent);
  const values = parser.parse(valuesContent);
  
  return {
    configmap: configmap,
    values: values,
    data: configmap.data || {},
    env: values.env || [],
    entrypoint: values.entrypoint || ''
  };
}

/**
 * Extracts Java system properties (-Dkey=value) from a command string
 */
function extractSystemProperties(command) {
  const regex = /-D([^=\s]+)=([^\s]+)/g;
  const properties = {};
  let match;
  
  while ((match = regex.exec(command)) !== null) {
    properties[match[1]] = match[2];
  }
  
  return properties;
}

/**
 * Extracts key mappings from env array
 */
function getEnvMappings(envArray) {
  const mappings = {};
  
  envArray.forEach(item => {
    if (item.valueFrom && 
        item.valueFrom.configMapKeyRef && 
        item.valueFrom.configMapKeyRef.key) {
      const configKey = item.valueFrom.configMapKeyRef.key;
      const envName = item.name;
      mappings[configKey] = envName;
    }
  });
  
  return mappings;
}

/**
 * Compares configurations across three paths
 */
function compareConfigs(path1, path2, path3) {
  // Read all configs
  let configs;
  try {
    configs = {
      path1: readConfigFiles(path1),
      path2: readConfigFiles(path2),
      path3: readConfigFiles(path3)
    };
  } catch (error) {
    console.error('Error reading files:', error.message);
    process.exit(1);
  }
  
  // Get all unique keys from all data objects
  const allDataKeys = new Set();
  Object.values(configs).forEach(config => {
    Object.keys(config.data).forEach(key => allDataKeys.add(key));
  });
  
  // Get env mappings for each config
  const envMappings = {
    path1: getEnvMappings(configs.path1.env),
    path2: getEnvMappings(configs.path2.env),
    path3: getEnvMappings(configs.path3.env)
  };
  
  // Create comparison table
  const pathNames = {
    path1: path.basename(path1),
    path2: path.basename(path2),
    path3: path.basename(path3)
  };
  
  // Header
  console.log('\n' + '='.repeat(140));
  console.log('CONFIGURATION COMPARISON REPORT');
  console.log('='.repeat(140));
  console.log(`Path 1: ${path1}`);
  console.log(`Path 2: ${path2}`);
  console.log(`Path 3: ${path3}`);
  console.log('='.repeat(140));
  
  // Table header
  const col1 = 'Config Key'.padEnd(20);
  const col2 = pathNames.path1.padEnd(25);
  const col3 = pathNames.path2.padEnd(25);
  const col4 = pathNames.path3.padEnd(25);
  const col5 = 'Match Status'.padEnd(15);
  const col6 = 'Differences';
  
  console.log(`${col1} | ${col2} | ${col3} | ${col4} | ${col5} | ${col6}`);
  console.log('-'.repeat(140));
  
  // Process each key
  allDataKeys.forEach(key => {
    const values = {
      path1: configs.path1.data[key] || '(missing)',
      path2: configs.path2.data[key] || '(missing)',
      path3: configs.path3.data[key] || '(missing)'
    };
    
    const envNames = {
      path1: envMappings.path1[key] || '(not mapped)',
      path2: envMappings.path2[key] || '(not mapped)',
      path3: envMappings.path3[key] || '(not mapped)'
    };
    
    // Check if all values match
    const valuesMatch = values.path1 === values.path2 && values.path2 === values.path3;
    const envMatch = envNames.path1 === envNames.path2 && envNames.path2 === envNames.path3;
    const allMatch = valuesMatch && envMatch && values.path1 !== '(missing)';
    
    // Determine differences
    const differences = [];
    if (!valuesMatch) {
      const uniqueValues = [...new Set([values.path1, values.path2, values.path3])];
      if (uniqueValues.length > 1) {
        differences.push(`Values differ: ${uniqueValues.join(', ')}`);
      }
    }
    if (!envMatch) {
      const uniqueEnvs = [...new Set([envNames.path1, envNames.path2, envNames.path3])];
      if (uniqueEnvs.length > 1) {
        differences.push(`Env names differ: ${uniqueEnvs.join(', ')}`);
      }
    }
    if (values.path1 === '(missing)' || values.path2 === '(missing)' || values.path3 === '(missing)') {
      const missing = [];
      if (values.path1 === '(missing)') missing.push(pathNames.path1);
      if (values.path2 === '(missing)') missing.push(pathNames.path2);
      if (values.path3 === '(missing)') missing.push(pathNames.path3);
      if (missing.length > 0) {
        differences.push(`Missing in: ${missing.join(', ')}`);
      }
    }
    
    // Format values for display (truncate if too long)
    const formatValue = (val) => {
      const str = String(val);
      return str.length > 23 ? str.substring(0, 20) + '...' : str;
    };
    
    // Print row
    const c1 = key.padEnd(20);
    const c2 = formatValue(values.path1).padEnd(25);
    const c3 = formatValue(values.path2).padEnd(25);
    const c4 = formatValue(values.path3).padEnd(25);
    const c5 = (allMatch ? '✓ MATCH' : '✗ DIFFER').padEnd(15);
    const c6 = differences.join('; ');
    
    console.log(`${c1} | ${c2} | ${c3} | ${c4} | ${c5} | ${c6}`);
  });
  
  console.log('='.repeat(140));
  
  // Compare entrypoints
  console.log('\nENTRYPOINT COMPARISON:');
  console.log('-'.repeat(100));
  const entrypoints = {
    [pathNames.path1]: configs.path1.entrypoint,
    [pathNames.path2]: configs.path2.entrypoint,
    [pathNames.path3]: configs.path3.entrypoint
  };
  
  const uniqueEntrypoints = [...new Set(Object.values(entrypoints))];
  if (uniqueEntrypoints.length === 1) {
    console.log('✓ All environments use the same entrypoint:');
    console.log(`  ${uniqueEntrypoints[0]}`);
  } else {
    console.log('✗ Entrypoints differ across environments:');
    Object.entries(entrypoints).forEach(([env, cmd]) => {
      console.log(`  ${env}: ${cmd || '(not defined)'}`);
    });
  }
  
  // Parse and compare Java system properties
  console.log('\nJAVA SYSTEM PROPERTIES COMPARISON:');
  console.log('-'.repeat(100));
  
  const systemProps = {
    [pathNames.path1]: extractSystemProperties(configs.path1.entrypoint),
    [pathNames.path2]: extractSystemProperties(configs.path2.entrypoint),
    [pathNames.path3]: extractSystemProperties(configs.path3.entrypoint)
  };
  
  // Get all unique property keys
  const allPropKeys = new Set();
  Object.values(systemProps).forEach(props => {
    Object.keys(props).forEach(key => allPropKeys.add(key));
  });
  
  // Sort the keys alphabetically
  const sortedPropKeys = Array.from(allPropKeys).sort();
  
  if (sortedPropKeys.length === 0) {
    console.log('  No Java system properties (-D arguments) found in any entrypoint');
  } else {
    // Create a comparison table for system properties
    const propCol1 = 'Property'.padEnd(30);
    const propCol2 = pathNames.path1.padEnd(30);
    const propCol3 = pathNames.path2.padEnd(30);
    const propCol4 = pathNames.path3.padEnd(30);
    const propCol5 = 'Match';
    
    console.log(`${propCol1} | ${propCol2} | ${propCol3} | ${propCol4} | ${propCol5}`);
    console.log('-'.repeat(140));
    
    sortedPropKeys.forEach(propKey => {
      const v1 = systemProps[pathNames.path1][propKey] || '(not set)';
      const v2 = systemProps[pathNames.path2][propKey] || '(not set)';
      const v3 = systemProps[pathNames.path3][propKey] || '(not set)';
      
      const allMatch = v1 === v2 && v2 === v3 && v1 !== '(not set)';
      const matchStatus = allMatch ? '✓' : '✗';
      
      // Format values for display
      const formatPropValue = (val) => {
        const str = String(val);
        return str.length > 28 ? str.substring(0, 25) + '...' : str;
      };
      
      const pc1 = propKey.padEnd(30);
      const pc2 = formatPropValue(v1).padEnd(30);
      const pc3 = formatPropValue(v2).padEnd(30);
      const pc4 = formatPropValue(v3).padEnd(30);
      
      console.log(`${pc1} | ${pc2} | ${pc3} | ${pc4} | ${matchStatus}`);
    });
  }
  
  // Compare other values.yaml fields
  console.log('\nVALUES.YAML ADDITIONAL FIELDS:');
  console.log('-'.repeat(100));
  
  // Get all unique top-level keys from values.yaml (excluding env and entrypoint)
  const allValuesKeys = new Set();
  Object.values(configs).forEach(config => {
    Object.keys(config.values).forEach(key => {
      if (key !== 'env' && key !== 'entrypoint') {
        allValuesKeys.add(key);
      }
    });
  });
  
  if (allValuesKeys.size > 0) {
    allValuesKeys.forEach(key => {
      const v1 = JSON.stringify(configs.path1.values[key]);
      const v2 = JSON.stringify(configs.path2.values[key]);
      const v3 = JSON.stringify(configs.path3.values[key]);
      
      if (v1 === v2 && v2 === v3) {
        console.log(`✓ ${key}: All match - ${v1 || 'undefined'}`);
      } else {
        console.log(`✗ ${key}: Values differ`);
        console.log(`    ${pathNames.path1}: ${v1 || 'undefined'}`);
        console.log(`    ${pathNames.path2}: ${v2 || 'undefined'}`);
        console.log(`    ${pathNames.path3}: ${v3 || 'undefined'}`);
      }
    });
  } else {
    console.log('  No additional fields found in values.yaml files');
  }
  
  // Summary statistics
  const totalKeys = allDataKeys.size;
  let matchingKeys = 0;
  let partialMatches = 0;
  let completelyDifferent = 0;
  
  allDataKeys.forEach(key => {
    const v1 = configs.path1.data[key];
    const v2 = configs.path2.data[key];
    const v3 = configs.path3.data[key];
    
    if (v1 === v2 && v2 === v3 && v1 !== undefined) {
      matchingKeys++;
    } else if ((v1 === v2 && v1 !== undefined) || 
               (v2 === v3 && v2 !== undefined) || 
               (v1 === v3 && v1 !== undefined)) {
      partialMatches++;
    } else {
      completelyDifferent++;
    }
  });
  
  console.log('\nSUMMARY:');
  console.log(`Total keys compared: ${totalKeys}`);
  console.log(`Fully matching: ${matchingKeys} (${(matchingKeys/totalKeys*100).toFixed(1)}%)`);
  console.log(`Partial matches: ${partialMatches} (${(partialMatches/totalKeys*100).toFixed(1)}%)`);
  console.log(`Completely different: ${completelyDifferent} (${(completelyDifferent/totalKeys*100).toFixed(1)}%)`);
  
  // Check env mapping consistency
  console.log('\nENV MAPPING ANALYSIS:');
  allDataKeys.forEach(key => {
    const env1 = envMappings.path1[key];
    const env2 = envMappings.path2[key];
    const env3 = envMappings.path3[key];
    
    if (!env1 && !env2 && !env3) {
      console.log(`  ⚠ "${key}" is not mapped to any env variable in any config`);
    } else if (!env1 || !env2 || !env3) {
      const missing = [];
      if (!env1) missing.push(pathNames.path1);
      if (!env2) missing.push(pathNames.path2);
      if (!env3) missing.push(pathNames.path3);
      console.log(`  ⚠ "${key}" is missing env mapping in: ${missing.join(', ')}`);
    }
  });
  
  // Check for env variables without data keys
  console.log('\nORPHAN ENV VARIABLES:');
  ['path1', 'path2', 'path3'].forEach(p => {
    const orphans = [];
    configs[p].env.forEach(item => {
      if (item.valueFrom && item.valueFrom.configMapKeyRef) {
        const key = item.valueFrom.configMapKeyRef.key;
        if (!configs[p].data[key]) {
          orphans.push(`${item.name} -> ${key}`);
        }
      }
    });
    if (orphans.length > 0) {
      console.log(`  ${pathNames[p]}: ${orphans.join(', ')}`);
    }
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.length !== 3) {
  console.error('Usage: node compare-configs.js <path1> <path2> <path3>');
  console.error('Example: node compare-configs.js ./env1 ./env2 ./env3');
  process.exit(1);
}

const [path1, path2, path3] = args;

// Validate paths exist
[path1, path2, path3].forEach(p => {
  if (!fs.existsSync(p)) {
    console.error(`Error: Path not found: ${p}`);
    process.exit(1);
  }
});

compareConfigs(path1, path2, path3);
