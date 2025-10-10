/**
 * Generic Protocol Buffer text format parser
 * Parses protobuf text format into JavaScript objects
 */
export function parseProtobufText(text: string): Record<string, any> {
    // Remove comments
    const lines = text.split('\n').map(line => {
        const commentIndex = line.indexOf('#');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
    }).join('\n');
    
    let pos = 0;
    
    function skipWhitespace() {
        while (pos < lines.length && /\s/.test(lines[pos])) {
            pos++;
        }
    }
    
    function parseValue(): any {
        skipWhitespace();
        
        // Check for string (quoted)
        if (lines[pos] === '"' || lines[pos] === "'") {
            const quote = lines[pos];
            pos++;
            let value = '';
            let escaped = false;
            
            while (pos < lines.length) {
                if (escaped) {
                    // Handle escape sequences
                    switch (lines[pos]) {
                        case 'n': value += '\n'; break;
                        case 't': value += '\t'; break;
                        case 'r': value += '\r'; break;
                        case '\\': value += '\\'; break;
                        case '"': value += '"'; break;
                        case "'": value += "'"; break;
                        default: value += lines[pos];
                    }
                    escaped = false;
                } else if (lines[pos] === '\\') {
                    escaped = true;
                } else if (lines[pos] === quote) {
                    pos++;
                    break;
                } else {
                    value += lines[pos];
                }
                pos++;
            }
            return value;
        }
        
        // Check for nested message
        if (lines[pos] === '{') {
            pos++;
            const nested = parseMessage();
            skipWhitespace();
            if (lines[pos] === '}') {
                pos++;
            }
            return nested;
        }
        
        // Parse number or identifier
        let value = '';
        while (pos < lines.length && /[^\s:{}]/.test(lines[pos])) {
            value += lines[pos];
            pos++;
        }
        
        // Try to parse as number
        if (/^-?\d+$/.test(value)) {
            return parseInt(value, 10);
        }
        if (/^-?\d+\.\d+$/.test(value)) {
            return parseFloat(value);
        }
        if (value === 'true') return true;
        if (value === 'false') return false;
        
        return value;
    }
    
    function parseMessage(): Record<string, any> {
        const obj: Record<string, any> = {};
        
        while (pos < lines.length) {
            skipWhitespace();
            
            if (lines[pos] === '}' || pos >= lines.length) {
                break;
            }
            
            // Parse field name
            let fieldName = '';
            while (pos < lines.length && /[a-zA-Z0-9_]/.test(lines[pos])) {
                fieldName += lines[pos];
                pos++;
            }
            
            if (!fieldName) {
                pos++;
                continue;
            }
            
            skipWhitespace();
            
            // Check if this is a key:value pair or key{...} nested object
            const isKeyValue = lines[pos] === ':';
            
            // Skip colon if present
            if (isKeyValue) {
                pos++;
            }
            
            skipWhitespace();
            
            // Parse value
            const value = parseValue();
            
            // Handle field assignment
            if (isKeyValue) {
                // For key:value pairs, only create array if field is repeated
                if (obj[fieldName] !== undefined) {
                    if (Array.isArray(obj[fieldName])) {
                        obj[fieldName].push(value);
                    } else {
                        obj[fieldName] = [obj[fieldName], value];
                    }
                } else {
                    obj[fieldName] = value;
                }
            } else {
                // For key {...} nested objects, always use arrays
                if (obj[fieldName] !== undefined) {
                    if (Array.isArray(obj[fieldName])) {
                        obj[fieldName].push(value);
                    } else {
                        obj[fieldName] = [obj[fieldName], value];
                    }
                } else {
                    obj[fieldName] = [value];
                }
            }
        }
        
        return obj;
    }
    
    return parseMessage();
}
