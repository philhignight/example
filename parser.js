class YAMLParser {
  constructor() {
    this.anchors = {};
  }

  parse(yamlString) {
    if (!yamlString || typeof yamlString !== 'string') {
      return null;
    }

    this.anchors = {};
    // Handle both Windows (\r\n) and Unix (\n) line endings
    const normalizedString = yamlString.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedString.split('\n');
    const result = this.parseLines(lines);
    return result;
  }

  parseLines(lines) {
    const cleanLines = this.preprocessLines(lines);
    
    if (cleanLines.length === 0) {
      return null;
    }

    const firstLine = cleanLines[0];
    if (firstLine.trim().startsWith('-')) {
      return this.parseArray(cleanLines);
    } else if (firstLine.includes(':')) {
      return this.parseObject(cleanLines);
    } else {
      return this.parseScalar(firstLine.trim());
    }
  }

  preprocessLines(lines) {
    return lines
      .map(line => {
        // Don't remove # if it's inside quotes
        let inSingleQuote = false;
        let inDoubleQuote = false;
        let commentIndex = -1;
        
        for (let i = 0; i < line.length; i++) {
          if (line[i] === "'" && !inDoubleQuote && (i === 0 || line[i-1] !== '\\')) {
            inSingleQuote = !inSingleQuote;
          } else if (line[i] === '"' && !inSingleQuote && (i === 0 || line[i-1] !== '\\')) {
            inDoubleQuote = !inDoubleQuote;
          } else if (line[i] === '#' && !inSingleQuote && !inDoubleQuote) {
            commentIndex = i;
            break;
          }
        }
        
        if (commentIndex !== -1) {
          return line.substring(0, commentIndex);
        }
        return line;
      })
      .filter(line => line.trim().length > 0);
  }

  parseObject(lines) {
    const obj = {};
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const indent = this.getIndent(line);
      const trimmed = line.trim();

      if (!trimmed.includes(':')) {
        i++;
        continue;
      }

      const colonIndex = trimmed.indexOf(':');
      const keyPart = trimmed.substring(0, colonIndex).trim();
      const valueAfterColon = trimmed.substring(colonIndex + 1).trim();

      let cleanKey = keyPart;
      let anchor = null;

      // Handle anchors in the key (e.g., "default: &default_settings")
      if (valueAfterColon.startsWith('&') && !valueAfterColon.includes(' ')) {
        // This is likely an anchor definition for the nested object
        anchor = valueAfterColon.substring(1);
        cleanKey = keyPart;
        // Continue to parse the nested object
        const childLines = [];
        i++;
        
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextIndent = this.getIndent(nextLine);
          
          if (nextIndent > indent) {
            childLines.push(nextLine);
            i++;
          } else {
            break;
          }
        }
        
        if (childLines.length > 0) {
          const minIndent = Math.min(...childLines.map(l => this.getIndent(l)));
          const normalizedLines = childLines.map(l => l.substring(minIndent));
          const value = this.parseLines(normalizedLines);
          obj[cleanKey] = value;
          this.anchors[anchor] = value;
        }
        continue;
      }

      // Check for anchor definitions in the key itself
      if (keyPart.startsWith('&')) {
        const spaceIndex = keyPart.indexOf(' ');
        if (spaceIndex !== -1) {
          anchor = keyPart.substring(1, spaceIndex);
          cleanKey = keyPart.substring(spaceIndex + 1).trim();
        } else {
          anchor = keyPart.substring(1);
          cleanKey = '';
        }
      }

      // Check if value is an alias reference
      if (valueAfterColon && valueAfterColon.startsWith('*')) {
        const anchorName = valueAfterColon.substring(1);
        if (this.anchors[anchorName]) {
          obj[cleanKey] = this.anchors[anchorName];
          i++;
          continue;
        }
      }

      // Check for anchor definition in the value
      if (valueAfterColon && valueAfterColon.startsWith('&')) {
        const parts = valueAfterColon.split(' ');
        if (parts.length > 1) {
          anchor = parts[0].substring(1);
          const restValue = parts.slice(1).join(' ');
          const value = this.parseScalar(restValue);
          obj[cleanKey] = value;
          this.anchors[anchor] = value;
          i++;
          continue;
        }
      }

      if (valueAfterColon) {
        const value = this.parseScalar(valueAfterColon);
        obj[cleanKey] = value;
        if (anchor) {
          this.anchors[anchor] = value;
        }
      } else {
        const childLines = [];
        i++;
        
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextIndent = this.getIndent(nextLine);
          
          if (nextIndent > indent) {
            childLines.push(nextLine);
            i++;
          } else {
            break;
          }
        }
        
        if (childLines.length > 0) {
          const minIndent = Math.min(...childLines.map(l => this.getIndent(l)));
          const normalizedLines = childLines.map(l => l.substring(minIndent));
          const value = this.parseLines(normalizedLines);
          obj[cleanKey] = value;
          if (anchor) {
            this.anchors[anchor] = value;
          }
        } else {
          obj[cleanKey] = null;
        }
        continue;
      }
      
      i++;
    }

    return obj;
  }

  parseArray(lines) {
    const arr = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const indent = this.getIndent(line);
      const trimmed = line.trim();

      if (!trimmed.startsWith('-')) {
        i++;
        continue;
      }

      const valueAfterDash = trimmed.substring(1).trim();

      if (valueAfterDash) {
        if (valueAfterDash.includes(':') && !valueAfterDash.startsWith('"') && !valueAfterDash.startsWith("'")) {
          // This is an object item in the array
          const objectLines = [valueAfterDash];
          i++;
          
          // Collect all lines for this object, including nested structures
          while (i < lines.length) {
            const nextLine = lines[i];
            const nextIndent = this.getIndent(nextLine);
            
            // If it's more indented than the dash, it belongs to this object
            if (nextIndent > indent) {
              objectLines.push(nextLine.substring(indent + 2));
              i++;
            } else {
              break;
            }
          }
          
          arr.push(this.parseObject(objectLines));
        } else {
          arr.push(this.parseScalar(valueAfterDash));
          i++;
        }
      } else {
        // Regular nested content
        const childLines = [];
        i++;
        
        while (i < lines.length) {
          const nextLine = lines[i];
          const nextIndent = this.getIndent(nextLine);
          
          if (nextIndent > indent) {
            childLines.push(nextLine.substring(indent + 2));
            i++;
          } else {
            break;
          }
        }
        
        if (childLines.length > 0) {
          arr.push(this.parseLines(childLines));
        } else {
          arr.push(null);
        }
      }
    }

    return arr;
  }

  parseScalar(value) {
    value = value.trim();

    if (value.startsWith('*')) {
      const anchorName = value.substring(1);
      if (this.anchors[anchorName]) {
        return this.anchors[anchorName];
      }
    }

    let anchorName = null;
    if (value.startsWith('&')) {
      const spaceIndex = value.indexOf(' ');
      if (spaceIndex !== -1) {
        anchorName = value.substring(1, spaceIndex);
        value = value.substring(spaceIndex + 1).trim();
      }
    }

    let result;

    if (value === 'null' || value === '~' || value === '') {
      result = null;
    } else if (value === 'true' || value === 'yes' || value === 'on') {
      result = true;
    } else if (value === 'false' || value === 'no' || value === 'off') {
      result = false;
    } else if ((value.startsWith('"') && value.endsWith('"')) || 
               (value.startsWith("'") && value.endsWith("'"))) {
      // Handle escaped characters within strings
      let str = value.substring(1, value.length - 1);
      if (value.startsWith('"')) {
        // Process escape sequences for double-quoted strings
        str = str
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
      } else {
        // For single quotes, only unescape single quotes
        str = str.replace(/\\'/g, "'");
      }
      result = str;
    } else if (/^-?\d+$/.test(value)) {
      result = parseInt(value, 10);
    } else if (/^-?\d*\.?\d+([eE][+-]?\d+)?$/.test(value)) {
      result = parseFloat(value);
    } else {
      result = value;
    }

    if (anchorName) {
      this.anchors[anchorName] = result;
    }

    return result;
  }

  getIndent(line) {
    let indent = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === ' ') {
        indent++;
      } else if (line[i] === '\t') {
        indent += 2;
      } else {
        break;
      }
    }
    return indent;
  }

  stringify(obj, indent = 0) {
    const spaces = ' '.repeat(indent);
    
    if (obj === null || obj === undefined) {
      return 'null';
    }
    
    if (typeof obj === 'boolean') {
      return obj.toString();
    }
    
    if (typeof obj === 'number') {
      return obj.toString();
    }
    
    if (typeof obj === 'string') {
      // If string contains newlines or special characters, quote it
      if (obj.includes('\n') || obj.includes('\r') || obj.includes('\t')) {
        // Escape the string and use double quotes
        const escaped = obj
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      }
      if (obj.includes(':') || obj.includes('#') || obj.includes('"') || obj.includes("'")) {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return obj.map(item => {
        if (typeof item === 'object' && item !== null) {
          const itemStr = this.stringify(item, indent + 2);
          const lines = itemStr.split('\n');
          return spaces + '- ' + lines[0] + (lines.length > 1 ? '\n' + lines.slice(1).join('\n') : '');
        } else {
          return spaces + '- ' + this.stringify(item, indent + 2);
        }
      }).join('\n');
    }
    
    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      if (entries.length === 0) return '{}';
      return entries.map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            return spaces + key + ':\n' + this.stringify(value, indent + 2);
          } else if (!Array.isArray(value) && Object.keys(value).length > 0) {
            return spaces + key + ':\n' + this.stringify(value, indent + 2);
          } else {
            return spaces + key + ': ' + this.stringify(value, indent + 2);
          }
        } else {
          return spaces + key + ': ' + this.stringify(value, indent + 2);
        }
      }).join('\n');
    }
    
    return String(obj);
  }
}

module.exports = YAMLParser;
