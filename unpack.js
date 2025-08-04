#!/usr/bin/env node
// DMDC GPT Server Unpacker
// This script extracts the combined server file back into project structure

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    console.log('Usage: node unpack.js <server-file>');
    console.log('Example: node unpack.js server');
    process.exit(1);
}

const serverFile = process.argv[2];

if (!fs.existsSync(serverFile)) {
    console.error('Server file not found:', serverFile);
    process.exit(1);
}

console.log('🚀 Unpacking server file:', serverFile);

const content = fs.readFileSync(serverFile, 'utf8');
const separator = '~~~~~~~~~~~~~~~~~~~~';
const sections = content.split(separator);

let filesCreated = 0;

for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim();
    if (!section) continue;
    
    // Skip header comments
    if (section.startsWith('#')) continue;
    
    // Look for file headers like "=== filename ==="
    const headerMatch = section.match(/^=== (.+) ===/m);
    if (!headerMatch) continue;
    
    const filename = headerMatch[1];
    
    // Skip the unpacker script itself and the combined JS file
    if (filename === 'unpack.js' || filename === 'app.js') continue;
    
    // Extract content after the header
    const lines = section.split('\n');
    const headerIndex = lines.findIndex(line => line.trim() === headerMatch[0]);
    if (headerIndex === -1) continue;
    
    // Content starts after header and empty line
    const contentLines = lines.slice(headerIndex + 2);
    const fileContent = contentLines.join('\n').trim();
    
    if (!fileContent) continue;
    
    // Create directory if needed
    const dir = path.dirname(filename);
    if (dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log('📁 Created directory:', dir);
    }
    
    // Write file
    fs.writeFileSync(filename, fileContent);
    console.log('📄 Created file:', filename);
    filesCreated++;
}

console.log('\n✅ Unpacking complete!');
console.log('Files created:', filesCreated);
console.log('\nYou can now run: mvn compile exec:java');