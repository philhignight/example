// DMDCGPT Combined JavaScript Build
// Generated on Mon Aug  4 07:30:15 PM UTC 2025
// Version: v1.2.3-docx-fix-1754335815

// ===== diff-viewer.js =====
(function() {
    'use strict';
    
    class DiffViewer {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                showLineNumbers: true,
                contextLines: 3,
                ...options
            };
            
            this.plugins = new Map();
            this.currentPlugin = null;
            this.diffData = null;
            this.originalContent = '';
            
            this.init();
        }
        
        init() {
            this.createElements();
        }
        
        createElements() {
            // Create wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'diff-viewer';
            this.wrapper.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.4;
                border: 1px solid #ccc;
                background: #fff;
                overflow: auto;
            `;
            
            // Create diff content display
            this.diffContent = document.createElement('div');
            this.diffContent.className = 'diff-content';
            this.diffContent.style.cssText = `
                padding: 0;
                margin: 0;
                white-space: pre;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
            `;
            
            this.wrapper.appendChild(this.diffContent);
            this.container.appendChild(this.wrapper);
        }
        
        registerPlugin(name, plugin) {
            if (!plugin || typeof plugin.highlight !== 'function') {
                throw new Error('Plugin must have a highlight method');
            }
            this.plugins.set(name, plugin);
        }
        
        setLanguage(pluginName) {
            if (!this.plugins.has(pluginName)) {
                throw new Error(`Plugin '${pluginName}' not found`);
            }
            this.currentPlugin = this.plugins.get(pluginName);
            this.updateDiff();
        }
        
        setDiff(diffData, originalContent = '') {
            this.diffData = diffData;
            this.originalContent = originalContent;
            this.updateDiff();
        }
        
        updateDiff() {
            if (!this.diffData) {
                this.diffContent.innerHTML = '';
                return;
            }
            
            try {
                const diffHtml = this.generateDiffHtml();
                this.diffContent.innerHTML = diffHtml;
            } catch (error) {
                console.error('Diff generation failed:', error);
                this.diffContent.innerHTML = this.escapeHtml('Error generating diff');
            }
        }
        
        generateDiffHtml() {
            const { file, replacements } = this.diffData;
            
            // Parse original content into lines
            const originalLines = this.originalContent.split('\n');
            
            // Create diff sections
            let diffHtml = this.createFileHeader(file);
            
            // Sort replacements by start_line to process in order
            const sortedReplacements = [...replacements].sort((a, b) => a.start_line - b.start_line);
            
            let currentLine = 1;
            
            for (const replacement of sortedReplacements) {
                // Add context before the change
                const contextStart = Math.max(currentLine, replacement.start_line - this.options.contextLines);
                
                if (contextStart > currentLine) {
                    // Add unchanged lines before context
                    for (let i = currentLine; i < contextStart; i++) {
                        if (i <= originalLines.length) {
                            diffHtml += this.createUnchangedLine(i, originalLines[i - 1]);
                        }
                    }
                    if (contextStart > currentLine + 1) {
                        diffHtml += this.createSeparator();
                    }
                }
                
                // Add context lines
                for (let i = contextStart; i < replacement.start_line; i++) {
                    if (i <= originalLines.length) {
                        diffHtml += this.createContextLine(i, originalLines[i - 1]);
                    }
                }
                
                // Add removed lines
                for (let i = replacement.start_line; i <= replacement.end_line; i++) {
                    if (i <= originalLines.length) {
                        diffHtml += this.createRemovedLine(i, originalLines[i - 1]);
                    }
                }
                
                // Add new lines
                if (replacement.new_content) {
                    const newLines = replacement.new_content.split('\n');
                    for (let i = 0; i < newLines.length; i++) {
                        diffHtml += this.createAddedLine(replacement.start_line + i, newLines[i]);
                    }
                }
                
                // Add context after the change
                const contextEnd = Math.min(originalLines.length, replacement.end_line + this.options.contextLines);
                for (let i = replacement.end_line + 1; i <= contextEnd; i++) {
                    if (i <= originalLines.length) {
                        diffHtml += this.createContextLine(i, originalLines[i - 1]);
                    }
                }
                
                currentLine = replacement.end_line + 1;
            }
            
            return diffHtml;
        }
        
        createFileHeader(filename) {
            return `<div class="diff-file-header" style="
                background: #f6f8fa;
                border-bottom: 1px solid #d1d9e0;
                padding: 8px 16px;
                font-weight: bold;
                color: #24292e;
            ">📄 ${this.escapeHtml(filename)}</div>`;
        }
        
        createUnchangedLine(lineNum, content) {
            return this.createDiffLine(lineNum, content, 'unchanged', '#f8f9fa', '');
        }
        
        createContextLine(lineNum, content) {
            return this.createDiffLine(lineNum, content, 'context', '', ' ');
        }
        
        createRemovedLine(lineNum, content) {
            return this.createDiffLine(lineNum, content, 'removed', '#ffeef0', '-');
        }
        
        createAddedLine(lineNum, content) {
            return this.createDiffLine(lineNum, content, 'added', '#e6ffed', '+');
        }
        
        createDiffLine(lineNum, content, type, bgColor, prefix) {
            const lineNumberHtml = this.options.showLineNumbers 
                ? `<span class="line-number" style="
                    display: inline-block;
                    width: 50px;
                    text-align: right;
                    padding-right: 8px;
                    color: #666;
                    background: #f6f8fa;
                    border-right: 1px solid #d1d9e0;
                    user-select: none;
                ">${lineNum}</span>`
                : '';
            
            const prefixHtml = `<span class="diff-prefix" style="
                display: inline-block;
                width: 20px;
                color: ${type === 'added' ? '#28a745' : type === 'removed' ? '#d73a49' : '#666'};
                font-weight: bold;
                user-select: none;
            ">${prefix}</span>`;
            
            const highlightedContent = this.highlightContent(content || '');
            
            return `<div class="diff-line diff-line-${type}" style="
                display: flex;
                background: ${bgColor};
                border-left: 3px solid ${
                    type === 'added' ? '#28a745' : 
                    type === 'removed' ? '#d73a49' : 
                    'transparent'
                };
                padding: 2px 0;
                margin: 0;
            ">
                ${lineNumberHtml}
                ${prefixHtml}
                <span class="diff-line-content" style="flex: 1; padding-left: 8px;">${highlightedContent}</span>
            </div>`;
        }
        
        createSeparator() {
            return `<div class="diff-separator" style="
                text-align: center;
                color: #666;
                background: #f6f8fa;
                padding: 4px;
                margin: 8px 0;
                border-top: 1px solid #e1e4e8;
                border-bottom: 1px solid #e1e4e8;
                font-size: 12px;
            ">⋯</div>`;
        }
        
        highlightContent(content) {
            if (!this.currentPlugin || !content.trim()) {
                return this.escapeHtml(content);
            }
            
            try {
                return this.currentPlugin.highlight(content);
            } catch (error) {
                console.error('Highlighting failed:', error);
                return this.escapeHtml(content);
            }
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Auto-detect language from file extension
        detectLanguageFromFile(filename) {
            const parts = filename.split('.');
            const ext = parts.length > 0 ? parts.pop().toLowerCase() : '';
            const langMap = {
                'java': 'java',
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'cpp': 'cpp',
                'c': 'c',
                'h': 'c'
            };
            
            return langMap[ext] || null;
        }
        
        // Utility method to auto-set language based on file
        autoSetLanguage() {
            if (!this.diffData?.file) return;
            
            const detectedLang = this.detectLanguageFromFile(this.diffData.file);
            if (detectedLang && this.plugins.has(detectedLang)) {
                this.setLanguage(detectedLang);
            }
        }
        
        // Get summary stats
        getDiffStats() {
            if (!this.diffData?.replacements) return { additions: 0, deletions: 0 };
            
            let additions = 0;
            let deletions = 0;
            
            for (const replacement of this.diffData.replacements) {
                const removedLines = replacement.end_line - replacement.start_line + 1;
                const addedLines = replacement.new_content ? replacement.new_content.split('\n').length : 0;
                
                deletions += removedLines;
                additions += addedLines;
            }
            
            return { additions, deletions };
        }
    }
    
    // Export to window
    window.DiffViewer = DiffViewer;
})();

// ===== editor.js =====
(function() {
    'use strict';
    
    class CodeEditor {
        constructor(container, options = {}) {
            this.container = container;
            this.options = {
                readOnly: false,
                tabSize: 4,
                showValidation: true,
                validationDelay: 500,
                ...options
            };
            
            this.plugins = new Map();
            this.currentPlugin = null;
            this.content = '';
            this.validationResult = null;
            this.validationTimeout = null;
            
            this.init();
        }
        
        init() {
            this.createElements();
            this.setupEventListeners();
        }
        
        createElements() {
            // Create wrapper
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'code-editor';
            this.wrapper.style.cssText = `
                position: relative;
                width: 100%;
                height: 100%;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.4;
                border: 1px solid #444;
                background: #1a1a1a;
                color: #e0e0e0;
            `;
            
            // Create highlighted code display
            this.highlightLayer = document.createElement('div');
            this.highlightLayer.className = 'code-highlight-layer';
            this.highlightLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 8px;
                margin: 0;
                border: none;
                outline: none;
                resize: none;
                white-space: pre;
                overflow: auto;
                pointer-events: none;
                z-index: 1;
                color: transparent;
                background: transparent;
            `;
            
            // Create validation indicator layer
            this.validationLayer = document.createElement('div');
            this.validationLayer.className = 'code-validation-layer';
            this.validationLayer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 8px;
                margin: 0;
                border: none;
                outline: none;
                resize: none;
                white-space: pre;
                overflow: auto;
                pointer-events: none;
                z-index: 3;
                color: transparent;
                background: transparent;
            `;
            
            // Create validation issues panel
            this.validationPanel = document.createElement('div');
            this.validationPanel.className = 'code-validation-panel';
            this.validationPanel.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                max-height: 150px;
                background: #2d2d2d;
                border-top: 1px solid #444;
                color: #e0e0e0;
                font-family: inherit;
                font-size: 12px;
                overflow-y: auto;
                z-index: 4;
                display: none;
            `;
            
            // Create text input textarea
            this.textarea = document.createElement('textarea');
            this.textarea.className = 'code-input-layer';
            this.textarea.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 8px;
                margin: 0;
                border: none;
                outline: none;
                resize: none;
                font-family: inherit;
                font-size: inherit;
                line-height: inherit;
                white-space: pre;
                overflow: auto;
                background: transparent;
                color: transparent;
                caret-color: #e0e0e0;
                z-index: 2;
            `;
            
            this.wrapper.appendChild(this.highlightLayer);
            this.wrapper.appendChild(this.validationLayer);
            this.wrapper.appendChild(this.textarea);
            this.wrapper.appendChild(this.validationPanel);
            this.container.appendChild(this.wrapper);
        }
        
        setupEventListeners() {
            this.textarea.addEventListener('input', () => {
                this.content = this.textarea.value;
                this.updateHighlighting();
                this.scheduleValidation();
                
                // Call the content change callback if provided
                if (this.onContentChange) {
                    this.onContentChange();
                }
            });
            
            this.textarea.addEventListener('scroll', () => {
                this.highlightLayer.scrollTop = this.textarea.scrollTop;
                this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
                this.validationLayer.scrollTop = this.textarea.scrollTop;
                this.validationLayer.scrollLeft = this.textarea.scrollLeft;
            });
            
            // Handle tab key
            this.textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.textarea.selectionStart;
                    const end = this.textarea.selectionEnd;
                    const tabSpaces = ' '.repeat(this.options.tabSize);
                    
                    this.textarea.value = 
                        this.textarea.value.substring(0, start) + 
                        tabSpaces + 
                        this.textarea.value.substring(end);
                    
                    this.textarea.selectionStart = this.textarea.selectionEnd = start + tabSpaces.length;
                    this.content = this.textarea.value;
                    this.updateHighlighting();
                }
            });
        }
        
        registerPlugin(name, plugin) {
            if (!plugin || typeof plugin.highlight !== 'function') {
                throw new Error('Plugin must have a highlight method');
            }
            this.plugins.set(name, plugin);
        }
        
        setLanguage(pluginName) {
            if (!this.plugins.has(pluginName)) {
                throw new Error(`Plugin '${pluginName}' not found`);
            }
            this.currentPlugin = this.plugins.get(pluginName);
            this.updateHighlighting();
        }
        
        updateHighlighting() {
            if (!this.currentPlugin) {
                this.highlightLayer.innerHTML = this.escapeHtml(this.content);
                return;
            }
            
            try {
                const highlighted = this.currentPlugin.highlight(this.content);
                this.highlightLayer.innerHTML = highlighted;
            } catch (error) {
                console.error('Highlighting failed:', error);
                this.highlightLayer.innerHTML = this.escapeHtml(this.content);
            }
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        setValue(content) {
            this.content = content;
            this.textarea.value = content;
            this.updateHighlighting();
        }
        
        getValue() {
            return this.content;
        }
        
        focus() {
            this.textarea.focus();
        }
        
        setReadOnly(readOnly) {
            this.options.readOnly = readOnly;
            this.textarea.readOnly = readOnly;
        }
        
        scheduleValidation() {
            if (!this.options.showValidation) {
                return;
            }
            
            // Clear existing timeout
            if (this.validationTimeout) {
                clearTimeout(this.validationTimeout);
            }
            
            // Schedule validation with delay
            this.validationTimeout = setTimeout(() => {
                this.validateContent();
            }, this.options.validationDelay);
        }
        
        validateContent() {
            if (!this.currentPlugin || !this.currentPlugin.hasValidation()) {
                this.clearValidation();
                return;
            }
            
            try {
                this.validationResult = this.currentPlugin.validate(this.content);
                this.updateValidationDisplay();
            } catch (error) {
                console.error('Validation failed:', error);
                this.clearValidation();
            }
        }
        
        updateValidationDisplay() {
            if (!this.validationResult) {
                this.clearValidation();
                return;
            }
            
            // Update validation layer with error/warning indicators
            this.updateValidationLayer();
            
            // Update validation panel with issue details
            this.updateValidationPanel();
        }
        
        updateValidationLayer() {
            if (!this.validationResult || !this.validationResult.hasIssues()) {
                this.validationLayer.innerHTML = '';
                return;
            }
            
            const lines = this.content.split('\n');
            let html = '';
            
            for (let i = 0; i < lines.length; i++) {
                const lineNum = i + 1;
                const line = lines[i];
                const lineIssues = this.validationResult.getAllIssues().filter(issue => issue.line === lineNum);
                
                if (lineIssues.length > 0) {
                    // Add error/warning indicators to the line
                    let lineHtml = this.escapeHtml(line);
                    
                    for (const issue of lineIssues) {
                        const color = issue.severity === 'error' ? '#ff6b6b' : '#ffd93d';
                        const indicator = `<span style="background-color: ${color}; opacity: 0.3; position: absolute; left: 0; right: 0; height: 1.4em; z-index: -1;"></span>`;
                        lineHtml = indicator + lineHtml;
                    }
                    
                    html += lineHtml;
                } else {
                    html += this.escapeHtml(line);
                }
                
                if (i < lines.length - 1) {
                    html += '\n';
                }
            }
            
            this.validationLayer.innerHTML = html;
        }
        
        updateValidationPanel() {
            if (!this.validationResult || !this.validationResult.hasIssues()) {
                this.validationPanel.style.display = 'none';
                return;
            }
            
            let html = '<div style="padding: 8px; font-weight: bold;">Validation Issues:</div>';
            
            const allIssues = this.validationResult.getAllIssues();
            for (const issue of allIssues) {
                const color = issue.severity === 'error' ? '#ff6b6b' : '#ffd93d';
                const icon = issue.severity === 'error' ? '✗' : '⚠';
                
                html += `
                    <div style="padding: 4px 8px; border-left: 3px solid ${color}; margin: 2px 0;">
                        <span style="color: ${color}; margin-right: 8px;">${icon}</span>
                        <strong>Line ${issue.line}:</strong> ${this.escapeHtml(issue.message)}
                        <small style="color: #888; margin-left: 8px;">(${issue.code})</small>
                    </div>
                `;
            }
            
            this.validationPanel.innerHTML = html;
            this.validationPanel.style.display = 'block';
        }
        
        clearValidation() {
            this.validationResult = null;
            this.validationLayer.innerHTML = '';
            this.validationPanel.style.display = 'none';
        }
        
        getValidationResult() {
            return this.validationResult;
        }
        
        setValidationEnabled(enabled) {
            this.options.showValidation = enabled;
            if (!enabled) {
                this.clearValidation();
            } else {
                this.scheduleValidation();
            }
        }
    }
    
    // Export to window
    window.CodeEditor = CodeEditor;
})();

// ===== plugin-interface.js =====
(function() {
    'use strict';
    
    /**
     * Base plugin interface for code editor syntax highlighting
     */
    class EditorPlugin {
        constructor(name) {
            this.name = name;
            this.validator = null;
        }
        
        /**
         * Highlight the given source code and return HTML with syntax highlighting
         * @param {string} sourceCode - The source code to highlight
         * @returns {string} HTML string with syntax highlighting
         */
        highlight(sourceCode) {
            throw new Error('Plugin must implement highlight method');
        }
        
        /**
         * Validate the given source code and return validation results
         * @param {string} sourceCode - The source code to validate
         * @returns {ValidationResult|null} Validation results or null if no validator
         */
        validate(sourceCode) {
            if (!this.validator) {
                return null;
            }
            return this.validator.validate(sourceCode);
        }
        
        /**
         * Set the validator for this plugin
         * @param {Object} validator - The validator instance
         */
        setValidator(validator) {
            this.validator = validator;
        }
        
        /**
         * Get the validator for this plugin
         * @returns {Object|null} The validator instance or null
         */
        getValidator() {
            return this.validator;
        }
        
        /**
         * Check if this plugin has validation support
         * @returns {boolean} True if validator is available
         */
        hasValidation() {
            return this.validator !== null;
        }
        
        /**
         * Get supported file extensions for this plugin
         * @returns {string[]} Array of file extensions (e.g., ['.java', '.class'])
         */
        getSupportedExtensions() {
            return [];
        }
        
        /**
         * Get the display name for this language
         * @returns {string} Display name
         */
        getDisplayName() {
            return this.name;
        }
        
        /**
         * Optional: Initialize the plugin with editor instance
         * @param {CodeEditor} editor - The editor instance
         */
        initialize(editor) {
            // Override if needed
        }
        
        /**
         * Optional: Cleanup when plugin is removed
         */
        destroy() {
            // Override if needed
        }
    }
    
    // Export to window
    window.EditorPlugin = EditorPlugin;
})();

// ===== java-ast.js =====
(function() {
    'use strict';
    
    // Base AST Node
    class ASTNode {
        constructor(type) {
            this.type = type;
        }
        
        toString() {
            return JSON.stringify(this, null, 2);
        }
    }
    
    // Program (root node)
    class Program extends ASTNode {
        constructor(classes = []) {
            super('Program');
            this.classes = classes;
        }
    }
    
    // Class Declaration
    class ClassDeclaration extends ASTNode {
        constructor(name, modifiers = [], fields = [], methods = [], superclass = null, interfaces = []) {
            super('ClassDeclaration');
            this.name = name;
            this.modifiers = modifiers;
            this.fields = fields;
            this.methods = methods;
            this.superclass = superclass;
            this.interfaces = interfaces;
        }
    }
    
    // Interface Declaration
    class InterfaceDeclaration extends ASTNode {
        constructor(name, modifiers = [], methods = [], interfaces = []) {
            super('InterfaceDeclaration');
            this.name = name;
            this.modifiers = modifiers;
            this.methods = methods;
            this.interfaces = interfaces;
        }
    }
    
    // Field Declaration
    class FieldDeclaration extends ASTNode {
        constructor(fieldType, name, modifiers = [], initializer = null) {
            super('FieldDeclaration');
            this.fieldType = fieldType;
            this.name = name;
            this.modifiers = modifiers;
            this.initializer = initializer;
        }
    }
    
    // Constructor Declaration
    class ConstructorDeclaration extends ASTNode {
        constructor(name, parameters = [], modifiers = [], body = null) {
            super('ConstructorDeclaration');
            this.name = name;
            this.parameters = parameters;
            this.modifiers = modifiers;
            this.body = body;
        }
    }
    
    // Method Declaration
    class MethodDeclaration extends ASTNode {
        constructor(name, returnType, parameters = [], modifiers = [], body = null, throwsClause = []) {
            super('MethodDeclaration');
            this.name = name;
            this.returnType = returnType;
            this.parameters = parameters;
            this.modifiers = modifiers;
            this.body = body;
            this.throwsClause = throwsClause;
        }
    }
    
    // Parameter
    class Parameter extends ASTNode {
        constructor(paramType, name) {
            super('Parameter');
            this.paramType = paramType;
            this.name = name;
        }
    }
    
    // Block Statement
    class BlockStatement extends ASTNode {
        constructor(statements = []) {
            super('BlockStatement');
            this.statements = statements;
        }
    }
    
    // Variable Declaration
    class VariableDeclaration extends ASTNode {
        constructor(varType, name, initializer = null) {
            super('VariableDeclaration');
            this.varType = varType;
            this.name = name;
            this.initializer = initializer;
        }
    }
    
    // Assignment Expression
    class AssignmentExpression extends ASTNode {
        constructor(left, right, operator = '=') {
            super('AssignmentExpression');
            this.left = left;
            this.right = right;
            this.operator = operator;
        }
    }
    
    // Binary Expression
    class BinaryExpression extends ASTNode {
        constructor(left, operator, right) {
            super('BinaryExpression');
            this.left = left;
            this.operator = operator;
            this.right = right;
        }
    }
    
    // Identifier
    class Identifier extends ASTNode {
        constructor(name) {
            super('Identifier');
            this.name = name;
        }
    }
    
    // Literal
    class Literal extends ASTNode {
        constructor(value, literalType) {
            super('Literal');
            this.value = value;
            this.literalType = literalType; // 'string', 'number'
        }
    }
    
    // Return Statement
    class ReturnStatement extends ASTNode {
        constructor(argument = null) {
            super('ReturnStatement');
            this.argument = argument;
        }
    }
    
    // If Statement
    class IfStatement extends ASTNode {
        constructor(condition, thenStatement, elseStatement = null) {
            super('IfStatement');
            this.condition = condition;
            this.thenStatement = thenStatement;
            this.elseStatement = elseStatement;
        }
    }
    
    // While Statement
    class WhileStatement extends ASTNode {
        constructor(condition, body) {
            super('WhileStatement');
            this.condition = condition;
            this.body = body;
        }
    }
    
    // For Statement
    class ForStatement extends ASTNode {
        constructor(init, condition, update, body) {
            super('ForStatement');
            this.init = init;
            this.condition = condition;
            this.update = update;
            this.body = body;
        }
    }
    
    // Enhanced For Statement (for-each)
    class EnhancedForStatement extends ASTNode {
        constructor(variable, iterable, body) {
            super('EnhancedForStatement');
            this.variable = variable;
            this.iterable = iterable;
            this.body = body;
        }
    }
    
    // Do-While Statement
    class DoWhileStatement extends ASTNode {
        constructor(body, condition) {
            super('DoWhileStatement');
            this.body = body;
            this.condition = condition;
        }
    }
    
    // Switch Statement
    class SwitchStatement extends ASTNode {
        constructor(expression, cases) {
            super('SwitchStatement');
            this.expression = expression;
            this.cases = cases;
        }
    }
    
    // Switch Case
    class SwitchCase extends ASTNode {
        constructor(test, statements, isDefault = false) {
            super('SwitchCase');
            this.test = test; // null for default case
            this.statements = statements;
            this.isDefault = isDefault;
        }
    }
    
    // Break Statement
    class BreakStatement extends ASTNode {
        constructor(label = null) {
            super('BreakStatement');
            this.label = label;
        }
    }
    
    // Continue Statement
    class ContinueStatement extends ASTNode {
        constructor(label = null) {
            super('ContinueStatement');
            this.label = label;
        }
    }
    
    // Try Statement
    class TryStatement extends ASTNode {
        constructor(block, handlers = [], finalizer = null) {
            super('TryStatement');
            this.block = block;
            this.handlers = handlers; // catch clauses
            this.finalizer = finalizer; // finally block
        }
    }
    
    // Catch Clause
    class CatchClause extends ASTNode {
        constructor(param, body) {
            super('CatchClause');
            this.param = param; // exception parameter
            this.body = body;
        }
    }
    
    // Throw Statement
    class ThrowStatement extends ASTNode {
        constructor(argument) {
            super('ThrowStatement');
            this.argument = argument;
        }
    }
    
    // Expression Statement
    class ExpressionStatement extends ASTNode {
        constructor(expression) {
            super('ExpressionStatement');
            this.expression = expression;
        }
    }
    
    // Method Call Expression
    class MethodCallExpression extends ASTNode {
        constructor(object, method, args = []) {
            super('MethodCallExpression');
            this.object = object;
            this.method = method;
            this.arguments = args;
        }
    }
    
    // Unary Expression
    class UnaryExpression extends ASTNode {
        constructor(operator, operand, prefix = true) {
            super('UnaryExpression');
            this.operator = operator;
            this.operand = operand;
            this.prefix = prefix; // true for ++x, false for x++
        }
    }
    
    // Ternary Expression
    class TernaryExpression extends ASTNode {
        constructor(test, consequent, alternate) {
            super('TernaryExpression');
            this.test = test;
            this.consequent = consequent;
            this.alternate = alternate;
        }
    }
    
    // Array Access Expression
    class ArrayAccessExpression extends ASTNode {
        constructor(array, index) {
            super('ArrayAccessExpression');
            this.array = array;
            this.index = index;
        }
    }
    
    // Array Creation Expression
    class ArrayCreationExpression extends ASTNode {
        constructor(elementType, dimensions, initializer = null) {
            super('ArrayCreationExpression');
            this.elementType = elementType;
            this.dimensions = dimensions; // array of expressions for each dimension
            this.initializer = initializer;
        }
    }
    
    // Object Creation Expression
    class ObjectCreationExpression extends ASTNode {
        constructor(constructorType, args = []) {
            super('ObjectCreationExpression');
            this.constructorType = constructorType;
            this.arguments = args;
        }
    }
    
    // This Expression
    class ThisExpression extends ASTNode {
        constructor() {
            super('ThisExpression');
        }
    }
    
    // Super Expression
    class SuperExpression extends ASTNode {
        constructor() {
            super('SuperExpression');
        }
    }
    
    // Package Declaration
    class PackageDeclaration extends ASTNode {
        constructor(name) {
            super('PackageDeclaration');
            this.name = name;
        }
    }
    
    // Import Declaration
    class ImportDeclaration extends ASTNode {
        constructor(name, isStatic = false, isWildcard = false) {
            super('ImportDeclaration');
            this.name = name;
            this.isStatic = isStatic;
            this.isWildcard = isWildcard;
        }
    }
    
    // Array Type
    class ArrayType extends ASTNode {
        constructor(elementType, dimensions = 1) {
            super('ArrayType');
            this.elementType = elementType;
            this.dimensions = dimensions;
        }
    }
    
    // Export to window
    window.JavaAST = {
        ASTNode,
        Program,
        ClassDeclaration,
        InterfaceDeclaration,
        FieldDeclaration,
        ConstructorDeclaration,
        MethodDeclaration,
        Parameter,
        BlockStatement,
        VariableDeclaration,
        AssignmentExpression,
        BinaryExpression,
        UnaryExpression,
        TernaryExpression,
        Identifier,
        Literal,
        ReturnStatement,
        IfStatement,
        WhileStatement,
        ForStatement,
        EnhancedForStatement,
        DoWhileStatement,
        SwitchStatement,
        SwitchCase,
        BreakStatement,
        ContinueStatement,
        TryStatement,
        CatchClause,
        ThrowStatement,
        ExpressionStatement,
        MethodCallExpression,
        ArrayAccessExpression,
        ArrayCreationExpression,
        ObjectCreationExpression,
        ThisExpression,
        SuperExpression,
        PackageDeclaration,
        ImportDeclaration,
        ArrayType
    };
})();

// ===== java-lexer.js =====
(function() {
    'use strict';
    
    const TokenType = {
        // Literals
        IDENTIFIER: 'IDENTIFIER',
        STRING_LITERAL: 'STRING_LITERAL',
        NUMBER_LITERAL: 'NUMBER_LITERAL',
        BOOLEAN_LITERAL: 'BOOLEAN_LITERAL',
        CHAR_LITERAL: 'CHAR_LITERAL',
        NULL_LITERAL: 'NULL_LITERAL',
        
        // Keywords
        CLASS: 'CLASS',
        INTERFACE: 'INTERFACE',
        EXTENDS: 'EXTENDS',
        IMPLEMENTS: 'IMPLEMENTS',
        PACKAGE: 'PACKAGE',
        IMPORT: 'IMPORT',
        PUBLIC: 'PUBLIC',
        PRIVATE: 'PRIVATE',
        PROTECTED: 'PROTECTED',
        STATIC: 'STATIC',
        FINAL: 'FINAL',
        ABSTRACT: 'ABSTRACT',
        VOID: 'VOID',
        INT: 'INT',
        STRING: 'STRING',
        BOOLEAN: 'BOOLEAN',
        CHAR: 'CHAR',
        LONG: 'LONG',
        DOUBLE: 'DOUBLE',
        FLOAT: 'FLOAT',
        BYTE: 'BYTE',
        SHORT: 'SHORT',
        IF: 'IF',
        ELSE: 'ELSE',
        WHILE: 'WHILE',
        FOR: 'FOR',
        DO: 'DO',
        SWITCH: 'SWITCH',
        CASE: 'CASE',
        DEFAULT: 'DEFAULT',
        BREAK: 'BREAK',
        CONTINUE: 'CONTINUE',
        RETURN: 'RETURN',
        TRY: 'TRY',
        CATCH: 'CATCH',
        FINALLY: 'FINALLY',
        THROW: 'THROW',
        THROWS: 'THROWS',
        NEW: 'NEW',
        THIS: 'THIS',
        SUPER: 'SUPER',
        TRUE: 'TRUE',
        FALSE: 'FALSE',
        NULL: 'NULL',
        
        // Operators
        PLUS: 'PLUS',
        MINUS: 'MINUS',
        MULTIPLY: 'MULTIPLY',
        DIVIDE: 'DIVIDE',
        MODULO: 'MODULO',
        ASSIGN: 'ASSIGN',
        PLUS_ASSIGN: 'PLUS_ASSIGN',
        MINUS_ASSIGN: 'MINUS_ASSIGN',
        MULTIPLY_ASSIGN: 'MULTIPLY_ASSIGN',
        DIVIDE_ASSIGN: 'DIVIDE_ASSIGN',
        INCREMENT: 'INCREMENT',
        DECREMENT: 'DECREMENT',
        EQUALS: 'EQUALS',
        NOT_EQUALS: 'NOT_EQUALS',
        LESS_THAN: 'LESS_THAN',
        GREATER_THAN: 'GREATER_THAN',
        LESS_EQUAL: 'LESS_EQUAL',
        GREATER_EQUAL: 'GREATER_EQUAL',
        LOGICAL_AND: 'LOGICAL_AND',
        LOGICAL_OR: 'LOGICAL_OR',
        LOGICAL_NOT: 'LOGICAL_NOT',
        BITWISE_AND: 'BITWISE_AND',
        BITWISE_OR: 'BITWISE_OR',
        BITWISE_XOR: 'BITWISE_XOR',
        BITWISE_NOT: 'BITWISE_NOT',
        LEFT_SHIFT: 'LEFT_SHIFT',
        RIGHT_SHIFT: 'RIGHT_SHIFT',
        UNSIGNED_RIGHT_SHIFT: 'UNSIGNED_RIGHT_SHIFT',
        TERNARY: 'TERNARY',
        
        // Delimiters
        LEFT_PAREN: 'LEFT_PAREN',
        RIGHT_PAREN: 'RIGHT_PAREN',
        LEFT_BRACE: 'LEFT_BRACE',
        RIGHT_BRACE: 'RIGHT_BRACE',
        LEFT_BRACKET: 'LEFT_BRACKET',
        RIGHT_BRACKET: 'RIGHT_BRACKET',
        SEMICOLON: 'SEMICOLON',
        COMMA: 'COMMA',
        DOT: 'DOT',
        COLON: 'COLON',
        
        // Special
        EOF: 'EOF',
        NEWLINE: 'NEWLINE',
        WHITESPACE: 'WHITESPACE'
    };
    
    class Token {
        constructor(type, value, line, column) {
            this.type = type;
            this.value = value;
            this.line = line;
            this.column = column;
        }
        
        toString() {
            return `Token(${this.type}, '${this.value}', ${this.line}:${this.column})`;
        }
    }
    
    class Lexer {
        constructor(input) {
            this.input = input;
            this.position = 0;
            this.line = 1;
            this.column = 1;
            this.tokens = [];
            
            this.keywords = {
                'class': TokenType.CLASS,
                'interface': TokenType.INTERFACE,
                'extends': TokenType.EXTENDS,
                'implements': TokenType.IMPLEMENTS,
                'package': TokenType.PACKAGE,
                'import': TokenType.IMPORT,
                'public': TokenType.PUBLIC,
                'private': TokenType.PRIVATE,
                'protected': TokenType.PROTECTED,
                'static': TokenType.STATIC,
                'final': TokenType.FINAL,
                'abstract': TokenType.ABSTRACT,
                'void': TokenType.VOID,
                'int': TokenType.INT,
                'String': TokenType.STRING,
                'boolean': TokenType.BOOLEAN,
                'char': TokenType.CHAR,
                'long': TokenType.LONG,
                'double': TokenType.DOUBLE,
                'float': TokenType.FLOAT,
                'byte': TokenType.BYTE,
                'short': TokenType.SHORT,
                'if': TokenType.IF,
                'else': TokenType.ELSE,
                'while': TokenType.WHILE,
                'for': TokenType.FOR,
                'do': TokenType.DO,
                'switch': TokenType.SWITCH,
                'case': TokenType.CASE,
                'default': TokenType.DEFAULT,
                'break': TokenType.BREAK,
                'continue': TokenType.CONTINUE,
                'return': TokenType.RETURN,
                'try': TokenType.TRY,
                'catch': TokenType.CATCH,
                'finally': TokenType.FINALLY,
                'throw': TokenType.THROW,
                'throws': TokenType.THROWS,
                'new': TokenType.NEW,
                'this': TokenType.THIS,
                'super': TokenType.SUPER,
                'true': TokenType.TRUE,
                'false': TokenType.FALSE,
                'null': TokenType.NULL
            };
        }
        
        peek(offset = 0) {
            const pos = this.position + offset;
            return pos < this.input.length ? this.input[pos] : '\0';
        }
        
        advance() {
            if (this.position < this.input.length) {
                const char = this.input[this.position];
                this.position++;
                if (char === '\n') {
                    this.line++;
                    this.column = 1;
                } else {
                    this.column++;
                }
                return char;
            }
            return '\0';
        }
        
        addToken(type, value = null) {
            this.tokens.push(new Token(type, value, this.line, this.column));
        }
        
        isAlpha(char) {
            return /[a-zA-Z_$]/.test(char);
        }
        
        isAlphaNumeric(char) {
            return /[a-zA-Z0-9_$]/.test(char);
        }
        
        isDigit(char) {
            return /[0-9]/.test(char);
        }
        
        isWhitespace(char) {
            return /[ \t\r]/.test(char);
        }
        
        scanString() {
            const startLine = this.line;
            const startColumn = this.column;
            let value = '';
            
            // Skip opening quote
            this.advance();
            
            while (this.peek() !== '"' && this.peek() !== '\0') {
                if (this.peek() === '\\') {
                    // Handle escape sequences
                    this.advance(); // consume backslash
                    const escaped = this.peek();
                    switch (escaped) {
                        case 'n':
                            value += '\n';
                            break;
                        case 't':
                            value += '\t';
                            break;
                        case 'r':
                            value += '\r';
                            break;
                        case '\\':
                            value += '\\';
                            break;
                        case '"':
                            value += '"';
                            break;
                        default:
                            value += escaped;
                    }
                    this.advance();
                } else {
                    value += this.advance();
                }
            }
            
            if (this.peek() === '\0') {
                throw new Error(`Unterminated string at line ${startLine}, column ${startColumn}`);
            }
            
            // Skip closing quote
            this.advance();
            
            this.tokens.push(new Token(TokenType.STRING_LITERAL, value, startLine, startColumn));
        }
        
        scanChar() {
            const startLine = this.line;
            const startColumn = this.column;
            let value = '';
            
            // Skip opening quote
            this.advance();
            
            if (this.peek() === '\\') {
                // Handle escape sequences
                this.advance(); // consume backslash
                const escaped = this.peek();
                switch (escaped) {
                    case 'n':
                        value = '\n';
                        break;
                    case 't':
                        value = '\t';
                        break;
                    case 'r':
                        value = '\r';
                        break;
                    case '\\':
                        value = '\\';
                        break;
                    case '\'':
                        value = '\'';
                        break;
                    default:
                        value = escaped;
                }
                this.advance();
            } else if (this.peek() !== '\'' && this.peek() !== '\0') {
                value = this.advance();
            }
            
            if (this.peek() !== '\'') {
                throw new Error(`Unterminated character literal at line ${startLine}, column ${startColumn}`);
            }
            
            // Skip closing quote
            this.advance();
            
            this.tokens.push(new Token(TokenType.CHAR_LITERAL, value, startLine, startColumn));
        }
        
        scanNumber() {
            const startColumn = this.column;
            let value = '';
            
            while (this.isDigit(this.peek())) {
                value += this.advance();
            }
            
            // Handle decimal point
            if (this.peek() === '.' && this.isDigit(this.peek(1))) {
                value += this.advance(); // consume '.'
                while (this.isDigit(this.peek())) {
                    value += this.advance();
                }
            }
            
            this.tokens.push(new Token(TokenType.NUMBER_LITERAL, value, this.line, startColumn));
        }
        
        scanIdentifier() {
            const startColumn = this.column;
            let value = '';
            
            while (this.isAlphaNumeric(this.peek())) {
                value += this.advance();
            }
            
            let tokenType = this.keywords[value] || TokenType.IDENTIFIER;
            
            // Special handling for boolean literals
            if (value === 'true' || value === 'false') {
                tokenType = TokenType.BOOLEAN_LITERAL;
            } else if (value === 'null') {
                tokenType = TokenType.NULL_LITERAL;
            }
            
            this.tokens.push(new Token(tokenType, value, this.line, startColumn));
        }
        
        scanToken() {
            const char = this.advance();
            
            switch (char) {
                case ' ':
                case '\t':
                case '\r':
                    // Skip whitespace
                    break;
                case '\n':
                    this.addToken(TokenType.NEWLINE);
                    break;
                case '(':
                    this.addToken(TokenType.LEFT_PAREN);
                    break;
                case ')':
                    this.addToken(TokenType.RIGHT_PAREN);
                    break;
                case '{':
                    this.addToken(TokenType.LEFT_BRACE);
                    break;
                case '}':
                    this.addToken(TokenType.RIGHT_BRACE);
                    break;
                case '[':
                    this.addToken(TokenType.LEFT_BRACKET);
                    break;
                case ']':
                    this.addToken(TokenType.RIGHT_BRACKET);
                    break;
                case ';':
                    this.addToken(TokenType.SEMICOLON);
                    break;
                case ',':
                    this.addToken(TokenType.COMMA);
                    break;
                case '.':
                    this.addToken(TokenType.DOT);
                    break;
                case '+':
                    if (this.peek() === '+') {
                        this.advance();
                        this.addToken(TokenType.INCREMENT, '++');
                    } else if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.PLUS_ASSIGN, '+=');
                    } else {
                        this.addToken(TokenType.PLUS, '+');
                    }
                    break;
                case '-':
                    if (this.peek() === '-') {
                        this.advance();
                        this.addToken(TokenType.DECREMENT, '--');
                    } else if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.MINUS_ASSIGN, '-=');
                    } else {
                        this.addToken(TokenType.MINUS, '-');
                    }
                    break;
                case '*':
                    if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.MULTIPLY_ASSIGN, '*=');
                    } else {
                        this.addToken(TokenType.MULTIPLY, '*');
                    }
                    break;
                case '/':
                    if (this.peek() === '/') {
                        // Line comment - skip to end of line
                        while (this.peek() !== '\n' && this.peek() !== '\0') {
                            this.advance();
                        }
                    } else if (this.peek() === '*') {
                        // Block comment
                        this.advance(); // consume '*'
                        while (!(this.peek() === '*' && this.peek(1) === '/') && this.peek() !== '\0') {
                            this.advance();
                        }
                        if (this.peek() !== '\0') {
                            this.advance(); // consume '*'
                            this.advance(); // consume '/'
                        }
                    } else if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.DIVIDE_ASSIGN, '/=');
                    } else {
                        this.addToken(TokenType.DIVIDE, '/');
                    }
                    break;
                case '%':
                    this.addToken(TokenType.MODULO, '%');
                    break;
                case '=':
                    if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.EQUALS, '==');
                    } else {
                        this.addToken(TokenType.ASSIGN, '=');
                    }
                    break;
                case '!':
                    if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.NOT_EQUALS, '!=');
                    } else {
                        this.addToken(TokenType.LOGICAL_NOT, '!');
                    }
                    break;
                case '<':
                    if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.LESS_EQUAL, '<=');
                    } else if (this.peek() === '<') {
                        this.advance();
                        this.addToken(TokenType.LEFT_SHIFT, '<<');
                    } else {
                        this.addToken(TokenType.LESS_THAN, '<');
                    }
                    break;
                case '>':
                    if (this.peek() === '=') {
                        this.advance();
                        this.addToken(TokenType.GREATER_EQUAL, '>=');
                    } else if (this.peek() === '>') {
                        this.advance();
                        if (this.peek() === '>') {
                            this.advance();
                            this.addToken(TokenType.UNSIGNED_RIGHT_SHIFT, '>>>');
                        } else {
                            this.addToken(TokenType.RIGHT_SHIFT, '>>');
                        }
                    } else {
                        this.addToken(TokenType.GREATER_THAN, '>');
                    }
                    break;
                case '&':
                    if (this.peek() === '&') {
                        this.advance();
                        this.addToken(TokenType.LOGICAL_AND, '&&');
                    } else {
                        this.addToken(TokenType.BITWISE_AND, '&');
                    }
                    break;
                case '|':
                    if (this.peek() === '|') {
                        this.advance();
                        this.addToken(TokenType.LOGICAL_OR, '||');
                    } else {
                        this.addToken(TokenType.BITWISE_OR, '|');
                    }
                    break;
                case '^':
                    this.addToken(TokenType.BITWISE_XOR, '^');
                    break;
                case '~':
                    this.addToken(TokenType.BITWISE_NOT, '~');
                    break;
                case '?':
                    this.addToken(TokenType.TERNARY, '?');
                    break;
                case ':':
                    this.addToken(TokenType.COLON, ':');
                    break;
                case '"':
                    // Put the quote back and scan string
                    this.position--;
                    this.column--;
                    this.scanString();
                    break;
                case '\'':
                    // Put the quote back and scan char
                    this.position--;
                    this.column--;
                    this.scanChar();
                    break;
                default:
                    if (this.isDigit(char)) {
                        // Put the digit back and scan number
                        this.position--;
                        this.column--;
                        this.scanNumber();
                    } else if (this.isAlpha(char)) {
                        // Put the character back and scan identifier
                        this.position--;
                        this.column--;
                        this.scanIdentifier();
                    } else {
                        throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
                    }
                    break;
            }
        }
        
        tokenize() {
            while (this.position < this.input.length) {
                this.scanToken();
            }
            
            this.addToken(TokenType.EOF);
            return this.tokens;
        }
    }
    
    // Export to window
    window.JavaLexer = {
        TokenType,
        Token,
        Lexer
    };
})();

// ===== java-parser.js =====
(function() {
    'use strict';
    
    class ParseError extends Error {
        constructor(message, token) {
            super(message);
            this.name = 'ParseError';
            this.token = token;
        }
    }
    
    class Parser {
        constructor(tokens) {
            this.tokens = tokens.filter(token => 
                token.type !== window.JavaLexer.TokenType.WHITESPACE &&
                token.type !== window.JavaLexer.TokenType.NEWLINE
            );
            this.current = 0;
        }
        
        peek() {
            return this.tokens[this.current];
        }
        
        previous() {
            return this.tokens[this.current - 1];
        }
        
        isAtEnd() {
            return this.peek().type === window.JavaLexer.TokenType.EOF;
        }
        
        advance() {
            if (!this.isAtEnd()) this.current++;
            return this.previous();
        }
        
        check(type) {
            if (this.isAtEnd()) return false;
            return this.peek().type === type;
        }
        
        match(...types) {
            for (const type of types) {
                if (this.check(type)) {
                    this.advance();
                    return true;
                }
            }
            return false;
        }
        
        checkAny(...types) {
            for (const type of types) {
                if (this.check(type)) {
                    return true;
                }
            }
            return false;
        }
        
        consume(type, message) {
            if (this.check(type)) return this.advance();
            throw new ParseError(message + ` Got ${this.peek().type}`, this.peek());
        }
        
        // Parse program (entry point)
        parse() {
            const declarations = [];
            let packageDecl = null;
            const imports = [];
            
            // Parse package declaration
            if (this.match(window.JavaLexer.TokenType.PACKAGE)) {
                packageDecl = this.packageDeclaration();
            }
            
            // Parse import declarations
            while (this.match(window.JavaLexer.TokenType.IMPORT)) {
                imports.push(this.importDeclaration());
            }
            
            // Parse type declarations (classes/interfaces)
            while (!this.isAtEnd()) {
                try {
                    if (this.checkAny(window.JavaLexer.TokenType.CLASS, window.JavaLexer.TokenType.INTERFACE,
                                     window.JavaLexer.TokenType.PUBLIC, window.JavaLexer.TokenType.PRIVATE,
                                     window.JavaLexer.TokenType.PROTECTED, window.JavaLexer.TokenType.STATIC,
                                     window.JavaLexer.TokenType.FINAL, window.JavaLexer.TokenType.ABSTRACT)) {
                        declarations.push(this.typeDeclaration());
                    } else {
                        this.advance(); // skip unexpected tokens
                    }
                } catch (error) {
                    this.synchronize();
                    throw error;
                }
            }
            
            const program = new window.JavaAST.Program(declarations);
            program.packageDeclaration = packageDecl;
            program.importDeclarations = imports;
            return program;
        }
        
        // Parse package declaration
        packageDeclaration() {
            const nameTokens = [];
            nameTokens.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected package name").value);
            
            while (this.match(window.JavaLexer.TokenType.DOT)) {
                nameTokens.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected package name").value);
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after package declaration");
            
            return new window.JavaAST.PackageDeclaration(nameTokens.join('.'));
        }
        
        // Parse import declaration
        importDeclaration() {
            const isStatic = this.match(window.JavaLexer.TokenType.STATIC);
            
            const nameTokens = [];
            nameTokens.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected import name").value);
            
            while (this.match(window.JavaLexer.TokenType.DOT)) {
                if (this.match(window.JavaLexer.TokenType.MULTIPLY)) {
                    nameTokens.push('*');
                    break;
                } else {
                    nameTokens.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected import name").value);
                }
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after import declaration");
            
            const isWildcard = nameTokens[nameTokens.length - 1] === '*';
            return new window.JavaAST.ImportDeclaration(nameTokens.join('.'), isStatic, isWildcard);
        }
        
        // Parse type declaration (class or interface)
        typeDeclaration() {
            const modifiers = this.parseModifiers();
            
            if (this.match(window.JavaLexer.TokenType.CLASS)) {
                return this.classDeclaration(modifiers);
            } else if (this.match(window.JavaLexer.TokenType.INTERFACE)) {
                return this.interfaceDeclaration(modifiers);
            } else {
                throw new ParseError("Expected class or interface declaration", this.peek());
            }
        }
        
        // Parse modifiers
        parseModifiers() {
            const modifiers = [];
            
            while (this.match(
                window.JavaLexer.TokenType.PUBLIC,
                window.JavaLexer.TokenType.PRIVATE,
                window.JavaLexer.TokenType.PROTECTED,
                window.JavaLexer.TokenType.STATIC,
                window.JavaLexer.TokenType.FINAL,
                window.JavaLexer.TokenType.ABSTRACT
            )) {
                modifiers.push(this.previous().value);
            }
            
            return modifiers;
        }
        
        // Parse class declaration
        classDeclaration(modifiers = []) {
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected class name").value;
            
            let superclass = null;
            if (this.match(window.JavaLexer.TokenType.EXTENDS)) {
                superclass = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected superclass name").value;
            }
            
            const interfaces = [];
            if (this.match(window.JavaLexer.TokenType.IMPLEMENTS)) {
                do {
                    interfaces.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected interface name").value);
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.LEFT_BRACE, "Expected '{' after class header");
            
            const fields = [];
            const methods = [];
            const constructors = [];
            
            while (!this.check(window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                const memberModifiers = this.parseModifiers();
                
                if (this.check(window.JavaLexer.TokenType.IDENTIFIER) && this.checkNext(window.JavaLexer.TokenType.LEFT_PAREN)) {
                    // Constructor
                    constructors.push(this.constructorDeclaration(memberModifiers));
                } else if (this.isType()) {
                    // Method or field
                    const member = this.memberDeclaration(memberModifiers);
                    if (member.type === 'MethodDeclaration') {
                        methods.push(member);
                    } else {
                        fields.push(member);
                    }
                } else {
                    throw new ParseError("Expected field, method, or constructor declaration", this.peek());
                }
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_BRACE, "Expected '}' after class body");
            
            const classDecl = new window.JavaAST.ClassDeclaration(name, modifiers, fields, methods, superclass, interfaces);
            classDecl.constructors = constructors;
            return classDecl;
        }
        
        // Parse interface declaration
        interfaceDeclaration(modifiers = []) {
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected interface name").value;
            
            const interfaces = [];
            if (this.match(window.JavaLexer.TokenType.EXTENDS)) {
                do {
                    interfaces.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected interface name").value);
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.LEFT_BRACE, "Expected '{' after interface header");
            
            const methods = [];
            
            while (!this.check(window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                const memberModifiers = this.parseModifiers();
                methods.push(this.abstractMethodDeclaration(memberModifiers));
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_BRACE, "Expected '}' after interface body");
            
            return new window.JavaAST.InterfaceDeclaration(name, modifiers, methods, interfaces);
        }
        
        // Check if current token starts a type
        isType() {
            return this.checkAny(
                window.JavaLexer.TokenType.VOID,
                window.JavaLexer.TokenType.INT,
                window.JavaLexer.TokenType.STRING,
                window.JavaLexer.TokenType.BOOLEAN,
                window.JavaLexer.TokenType.CHAR,
                window.JavaLexer.TokenType.LONG,
                window.JavaLexer.TokenType.DOUBLE,
                window.JavaLexer.TokenType.FLOAT,
                window.JavaLexer.TokenType.BYTE,
                window.JavaLexer.TokenType.SHORT,
                window.JavaLexer.TokenType.IDENTIFIER
            );
        }
        
        // Check next token without consuming current
        checkNext(type) {
            if (this.current + 1 >= this.tokens.length) return false;
            return this.tokens[this.current + 1].type === type;
        }
        
        // Parse member declaration (method or field)
        memberDeclaration(modifiers = []) {
            const type = this.parseType();
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected name").value;
            
            if (this.match(window.JavaLexer.TokenType.LEFT_PAREN)) {
                // Method declaration
                return this.finishMethodDeclaration(name, type, modifiers);
            } else {
                // Field declaration
                return this.finishFieldDeclaration(name, type, modifiers);
            }
        }
        
        // Parse constructor declaration
        constructorDeclaration(modifiers = []) {
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected constructor name").value;
            
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after constructor name");
            
            const parameters = [];
            if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                do {
                    parameters.push(this.parameter());
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
            
            const body = this.blockStatement();
            
            return new window.JavaAST.ConstructorDeclaration(name, parameters, modifiers, body);
        }
        
        // Parse method declaration
        finishMethodDeclaration(name, returnType, modifiers) {
            const parameters = [];
            if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                do {
                    parameters.push(this.parameter());
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
            
            const throwsClause = [];
            if (this.match(window.JavaLexer.TokenType.THROWS)) {
                do {
                    throwsClause.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected exception type").value);
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            let body = null;
            if (this.check(window.JavaLexer.TokenType.LEFT_BRACE)) {
                body = this.blockStatement();
            } else {
                this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' for abstract method");
            }
            
            return new window.JavaAST.MethodDeclaration(name, returnType, parameters, modifiers, body, throwsClause);
        }
        
        // Parse abstract method declaration (for interfaces)
        abstractMethodDeclaration(modifiers = []) {
            const returnType = this.parseType();
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected method name").value;
            
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after method name");
            
            const parameters = [];
            if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                do {
                    parameters.push(this.parameter());
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
            
            const throwsClause = [];
            if (this.match(window.JavaLexer.TokenType.THROWS)) {
                do {
                    throwsClause.push(this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected exception type").value);
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after abstract method");
            
            return new window.JavaAST.MethodDeclaration(name, returnType, parameters, modifiers, null, throwsClause);
        }
        
        // Parse field declaration
        finishFieldDeclaration(name, type, modifiers) {
            let initializer = null;
            if (this.match(window.JavaLexer.TokenType.ASSIGN)) {
                initializer = this.expression();
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after field declaration");
            
            return new window.JavaAST.FieldDeclaration(type, name, modifiers, initializer);
        }
        
        // Parse type
        parseType() {
            let type;
            
            if (this.match(window.JavaLexer.TokenType.VOID)) {
                type = 'void';
            } else if (this.match(window.JavaLexer.TokenType.INT)) {
                type = 'int';
            } else if (this.match(window.JavaLexer.TokenType.STRING)) {
                type = 'String';
            } else if (this.match(window.JavaLexer.TokenType.BOOLEAN)) {
                type = 'boolean';
            } else if (this.match(window.JavaLexer.TokenType.CHAR)) {
                type = 'char';
            } else if (this.match(window.JavaLexer.TokenType.LONG)) {
                type = 'long';
            } else if (this.match(window.JavaLexer.TokenType.DOUBLE)) {
                type = 'double';
            } else if (this.match(window.JavaLexer.TokenType.FLOAT)) {
                type = 'float';
            } else if (this.match(window.JavaLexer.TokenType.BYTE)) {
                type = 'byte';
            } else if (this.match(window.JavaLexer.TokenType.SHORT)) {
                type = 'short';
            } else if (this.match(window.JavaLexer.TokenType.IDENTIFIER)) {
                type = this.previous().value;
            } else {
                throw new ParseError("Expected type", this.peek());
            }
            
            // Handle array types
            let dimensions = 0;
            while (this.match(window.JavaLexer.TokenType.LEFT_BRACKET)) {
                this.consume(window.JavaLexer.TokenType.RIGHT_BRACKET, "Expected ']' after '['" );
                dimensions++;
            }
            
            if (dimensions > 0) {
                return new window.JavaAST.ArrayType(type, dimensions);
            }
            
            return type;
        }
        
        // Parse method declaration
        methodDeclaration() {
            const modifiers = [];
            
            // Parse modifiers
            while (this.match(
                window.JavaLexer.TokenType.PUBLIC, 
                window.JavaLexer.TokenType.PRIVATE, 
                window.JavaLexer.TokenType.STATIC
            )) {
                modifiers.push(this.previous().value);
            }
            
            // Parse return type
            let returnType;
            if (this.match(window.JavaLexer.TokenType.VOID)) {
                returnType = 'void';
            } else if (this.match(window.JavaLexer.TokenType.INT)) {
                returnType = 'int';
            } else if (this.match(window.JavaLexer.TokenType.STRING)) {
                returnType = 'String';
            } else {
                throw new ParseError("Expected return type", this.peek());
            }
            
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected method name").value;
            
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after method name");
            
            const parameters = [];
            if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                do {
                    parameters.push(this.parameter());
                } while (this.match(window.JavaLexer.TokenType.COMMA));
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after parameters");
            
            const body = this.blockStatement();
            
            return new window.JavaAST.MethodDeclaration(name, returnType, parameters, modifiers, body);
        }
        
        // Parse parameter
        parameter() {
            const type = this.parseType();
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected parameter name").value;
            
            return new window.JavaAST.Parameter(type, name);
        }
        
        // Parse block statement
        blockStatement() {
            this.consume(window.JavaLexer.TokenType.LEFT_BRACE, "Expected '{'");
            
            const statements = [];
            while (!this.check(window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                statements.push(this.statement());
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_BRACE, "Expected '}'");
            
            return new window.JavaAST.BlockStatement(statements);
        }
        
        // Parse statement
        statement() {
            if (this.match(window.JavaLexer.TokenType.IF)) {
                return this.ifStatement();
            }
            if (this.match(window.JavaLexer.TokenType.WHILE)) {
                return this.whileStatement();
            }
            if (this.match(window.JavaLexer.TokenType.FOR)) {
                return this.forStatement();
            }
            if (this.match(window.JavaLexer.TokenType.DO)) {
                return this.doWhileStatement();
            }
            if (this.match(window.JavaLexer.TokenType.SWITCH)) {
                return this.switchStatement();
            }
            if (this.match(window.JavaLexer.TokenType.TRY)) {
                return this.tryStatement();
            }
            if (this.match(window.JavaLexer.TokenType.BREAK)) {
                return this.breakStatement();
            }
            if (this.match(window.JavaLexer.TokenType.CONTINUE)) {
                return this.continueStatement();
            }
            if (this.match(window.JavaLexer.TokenType.THROW)) {
                return this.throwStatement();
            }
            if (this.match(window.JavaLexer.TokenType.RETURN)) {
                return this.returnStatement();
            }
            if (this.match(window.JavaLexer.TokenType.INT, window.JavaLexer.TokenType.STRING, 
                              window.JavaLexer.TokenType.BOOLEAN, window.JavaLexer.TokenType.CHAR,
                              window.JavaLexer.TokenType.BYTE, window.JavaLexer.TokenType.SHORT,
                              window.JavaLexer.TokenType.LONG, window.JavaLexer.TokenType.FLOAT,
                              window.JavaLexer.TokenType.DOUBLE)) {
                return this.variableDeclaration();
            }
            if (this.check(window.JavaLexer.TokenType.IDENTIFIER) && this.isTypeDeclaration()) {
                return this.variableDeclaration();
            }
            if (this.check(window.JavaLexer.TokenType.LEFT_BRACE)) {
                return this.blockStatement();
            }
            
            return this.expressionStatement();
        }
        
        // Parse if statement
        ifStatement() {
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'if'");
            const condition = this.expression();
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after if condition");
            
            const thenStatement = this.statement();
            let elseStatement = null;
            
            if (this.match(window.JavaLexer.TokenType.ELSE)) {
                elseStatement = this.statement();
            }
            
            return new window.JavaAST.IfStatement(condition, thenStatement, elseStatement);
        }
        
        // Parse while statement
        whileStatement() {
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'while'");
            const condition = this.expression();
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after while condition");
            
            const body = this.statement();
            
            return new window.JavaAST.WhileStatement(condition, body);
        }
        
        // Parse return statement
        returnStatement() {
            let argument = null;
            if (!this.check(window.JavaLexer.TokenType.SEMICOLON)) {
                argument = this.expression();
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after return value");
            
            return new window.JavaAST.ReturnStatement(argument);
        }
        
        // Helper method to check if this is a type declaration
        isTypeDeclaration() {
            // Simple heuristic: look ahead to see if identifier is followed by another identifier or [
            let current = this.current;
            if (current >= this.tokens.length) return false;
            
            // Skip potential array brackets
            current++;
            while (current < this.tokens.length && this.tokens[current].type === window.JavaLexer.TokenType.LEFT_BRACKET) {
                current++;
                if (current < this.tokens.length && this.tokens[current].type === window.JavaLexer.TokenType.RIGHT_BRACKET) {
                    current++;
                } else {
                    return false; // Malformed array type
                }
            }
            
            // Check if followed by identifier (variable name)
            return current < this.tokens.length && this.tokens[current].type === window.JavaLexer.TokenType.IDENTIFIER;
        }

        // Parse variable declaration
        variableDeclaration() {
            // Handle two cases: type token already consumed by match(), or IDENTIFIER checked but not consumed
            let type;
            if (this.previous().type !== window.JavaLexer.TokenType.EOF && 
                this.previous().type !== window.JavaLexer.TokenType.IDENTIFIER) {
                // Type token was consumed by match() - step back to re-parse with array dimensions
                this.current--;
                type = this.parseType();
            } else {
                // IDENTIFIER case - type not consumed yet
                type = this.parseType();
            }
            
            const name = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected variable name").value;
            
            let initializer = null;
            if (this.match(window.JavaLexer.TokenType.ASSIGN)) {
                initializer = this.expression();
            }
            
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after variable declaration");
            
            return new window.JavaAST.VariableDeclaration(type, name, initializer);
        }
        
        // Parse expression statement
        expressionStatement() {
            const expr = this.expression();
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after expression");
            return new window.JavaAST.ExpressionStatement(expr);
        }
        
        // Parse for statement
        forStatement() {
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'for'");
            
            // Handle enhanced for loop (for-each)
            if (this.checkEnhancedFor()) {
                return this.enhancedForStatement();
            }
            
            // Regular for loop
            let init = null;
            if (!this.check(window.JavaLexer.TokenType.SEMICOLON)) {
                if (this.match(window.JavaLexer.TokenType.INT, window.JavaLexer.TokenType.STRING, window.JavaLexer.TokenType.BOOLEAN)) {
                    init = this.variableDeclaration();
                } else {
                    init = this.expression();
                }
            } else {
                this.advance(); // consume semicolon
            }
            const condition = this.match(window.JavaLexer.TokenType.SEMICOLON) ? null : this.expression();
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after for condition");
            const update = this.check(window.JavaLexer.TokenType.RIGHT_PAREN) ? null : this.expression();
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after for clauses");
            const body = this.statement();
            
            return new window.JavaAST.ForStatement(init, condition, update, body);
        }
        
        // Check if this is an enhanced for loop
        checkEnhancedFor() {
            let current = this.current;
            
            // Skip type
            if (this.checkAt(current, window.JavaLexer.TokenType.INT, window.JavaLexer.TokenType.STRING) ||
                this.checkAt(current, window.JavaLexer.TokenType.IDENTIFIER)) {
                current++;
                
                // Skip array brackets if present
                while (this.checkAt(current, window.JavaLexer.TokenType.LEFT_BRACKET)) {
                    current++;
                    if (this.checkAt(current, window.JavaLexer.TokenType.RIGHT_BRACKET)) {
                        current++;
                    }
                }
                
                // Check for variable name followed by colon
                if (this.checkAt(current, window.JavaLexer.TokenType.IDENTIFIER)) {
                    current++;
                    return this.checkAt(current, window.JavaLexer.TokenType.COLON);
                }
            }
            
            return false;
        }
        
        // Helper method to check token at specific position
        checkAt(position, ...types) {
            if (position >= this.tokens.length) return false;
            return types.includes(this.tokens[position].type);
        }
        
        // Parse enhanced for statement (for-each)
        enhancedForStatement() {
            const elementType = this.parseType();
            const elementName = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected variable name").value;
            this.consume(window.JavaLexer.TokenType.COLON, "Expected ':' in enhanced for loop");
            const iterable = this.expression();
            
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after enhanced for");
            const body = this.statement();
            
            // Create variable object for enhanced for loop
            const variable = {
                paramType: elementType,
                name: elementName
            };
            
            return new window.JavaAST.EnhancedForStatement(variable, iterable, body);
        }
        
        // Parse do-while statement
        doWhileStatement() {
            const body = this.statement();
            this.consume(window.JavaLexer.TokenType.WHILE, "Expected 'while' after do body");
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'while'");
            const condition = this.expression();
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after condition");
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after do-while statement");
            
            return new window.JavaAST.DoWhileStatement(body, condition);
        }
        
        // Parse switch statement
        switchStatement() {
            this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'switch'");
            const discriminant = this.expression();
            this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after switch expression");
            
            this.consume(window.JavaLexer.TokenType.LEFT_BRACE, "Expected '{' to begin switch body");
            const cases = [];
            
            while (!this.check(window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                if (this.match(window.JavaLexer.TokenType.CASE)) {
                    const value = this.expression();
                    this.consume(window.JavaLexer.TokenType.COLON, "Expected ':' after case value");
                    const statements = [];
                    
                    while (!this.check(window.JavaLexer.TokenType.CASE, window.JavaLexer.TokenType.DEFAULT, window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                        statements.push(this.statement());
                    }
                    
                    cases.push(new window.JavaAST.SwitchCase(value, statements));
                } else if (this.match(window.JavaLexer.TokenType.DEFAULT)) {
                    this.consume(window.JavaLexer.TokenType.COLON, "Expected ':' after 'default'");
                    const statements = [];
                    
                    while (!this.check(window.JavaLexer.TokenType.CASE, window.JavaLexer.TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
                        statements.push(this.statement());
                    }
                    
                    cases.push(new window.JavaAST.SwitchCase(null, statements));
                } else {
                    throw new ParseError("Expected 'case' or 'default' in switch statement", this.peek());
                }
            }
            
            this.consume(window.JavaLexer.TokenType.RIGHT_BRACE, "Expected '}' after switch body");
            return new window.JavaAST.SwitchStatement(discriminant, cases);
        }
        
        // Parse try-catch-finally statement
        tryStatement() {
            const tryBlock = this.blockStatement();
            const catchClauses = [];
            let finallyBlock = null;
            
            while (this.match(window.JavaLexer.TokenType.CATCH)) {
                this.consume(window.JavaLexer.TokenType.LEFT_PAREN, "Expected '(' after 'catch'");
                const exceptionType = this.parseType();
                const exceptionName = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected exception variable name").value;
                this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after catch parameter");
                const catchBody = this.blockStatement();
                
                // Create param object for catch clause
                const param = {
                    paramType: exceptionType,
                    name: exceptionName
                };
                
                catchClauses.push(new window.JavaAST.CatchClause(param, catchBody));
            }
            
            if (this.match(window.JavaLexer.TokenType.FINALLY)) {
                finallyBlock = this.blockStatement();
            }
            
            if (catchClauses.length === 0 && finallyBlock === null) {
                throw new ParseError("Expected 'catch' or 'finally' after 'try'", this.peek());
            }
            
            return new window.JavaAST.TryStatement(tryBlock, catchClauses, finallyBlock);
        }
        
        // Parse break statement
        breakStatement() {
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after 'break'");
            return new window.JavaAST.BreakStatement();
        }
        
        // Parse continue statement
        continueStatement() {
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after 'continue'");
            return new window.JavaAST.ContinueStatement();
        }
        
        // Parse throw statement
        throwStatement() {
            const expression = this.expression();
            this.consume(window.JavaLexer.TokenType.SEMICOLON, "Expected ';' after throw expression");
            return new window.JavaAST.ThrowStatement(expression);
        }
        
        // Parse expression
        expression() {
            return this.ternary();
        }
        
        // Parse ternary expression
        ternary() {
            let expr = this.logicalOr();
            
            if (this.match(window.JavaLexer.TokenType.TERNARY)) {
                const consequent = this.expression();
                this.consume(window.JavaLexer.TokenType.COLON, "Expected ':' after ternary consequent");
                const alternate = this.expression();
                expr = new window.JavaAST.TernaryExpression(expr, consequent, alternate);
            }
            
            return expr;
        }
        
        // Parse logical OR
        logicalOr() {
            let expr = this.logicalAnd();
            
            while (this.match(window.JavaLexer.TokenType.LOGICAL_OR)) {
                const operator = this.previous().value;
                const right = this.logicalAnd();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse logical AND
        logicalAnd() {
            let expr = this.bitwiseOr();
            
            while (this.match(window.JavaLexer.TokenType.LOGICAL_AND)) {
                const operator = this.previous().value;
                const right = this.bitwiseOr();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse bitwise OR (lowest precedence)
        bitwiseOr() {
            let expr = this.bitwiseXor();
            
            while (this.match(window.JavaLexer.TokenType.BITWISE_OR)) {
                const operator = this.previous().value;
                const right = this.bitwiseXor();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse bitwise XOR (middle precedence)
        bitwiseXor() {
            let expr = this.bitwiseAnd();
            
            while (this.match(window.JavaLexer.TokenType.BITWISE_XOR)) {
                const operator = this.previous().value;
                const right = this.bitwiseAnd();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse bitwise AND
        bitwiseAnd() {
            let expr = this.assignment();
            
            while (this.match(window.JavaLexer.TokenType.BITWISE_AND)) {
                const operator = this.previous().value;
                const right = this.assignment();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse assignment
        assignment() {
            const expr = this.equality();
            
            if (this.match(
                window.JavaLexer.TokenType.ASSIGN,
                window.JavaLexer.TokenType.PLUS_ASSIGN,
                window.JavaLexer.TokenType.MINUS_ASSIGN,
                window.JavaLexer.TokenType.MULTIPLY_ASSIGN,
                window.JavaLexer.TokenType.DIVIDE_ASSIGN
            )) {
                const operator = this.previous().value;
                const right = this.assignment();
                return new window.JavaAST.AssignmentExpression(expr, right, operator);
            }
            
            return expr;
        }
        
        // Parse equality
        equality() {
            let expr = this.comparison();
            
            while (this.match(window.JavaLexer.TokenType.EQUALS, window.JavaLexer.TokenType.NOT_EQUALS)) {
                const operator = this.previous().value;
                const right = this.comparison();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse comparison
        comparison() {
            let expr = this.shift();
            
            while (this.match(
                window.JavaLexer.TokenType.GREATER_THAN,
                window.JavaLexer.TokenType.LESS_THAN,
                window.JavaLexer.TokenType.GREATER_EQUAL,
                window.JavaLexer.TokenType.LESS_EQUAL
            )) {
                const operator = this.previous().value;
                const right = this.shift();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse shift operations
        shift() {
            let expr = this.term();
            
            while (this.match(
                window.JavaLexer.TokenType.LEFT_SHIFT,
                window.JavaLexer.TokenType.RIGHT_SHIFT,
                window.JavaLexer.TokenType.UNSIGNED_RIGHT_SHIFT
            )) {
                const operator = this.previous().value;
                const right = this.term();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse term (addition/subtraction)
        term() {
            let expr = this.factor();
            
            while (this.match(window.JavaLexer.TokenType.MINUS, window.JavaLexer.TokenType.PLUS)) {
                const operator = this.previous().value;
                const right = this.factor();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse factor (multiplication/division/modulo)
        factor() {
            let expr = this.unary();
            
            while (this.match(
                window.JavaLexer.TokenType.DIVIDE,
                window.JavaLexer.TokenType.MULTIPLY,
                window.JavaLexer.TokenType.MODULO
            )) {
                const operator = this.previous().value;
                const right = this.unary();
                expr = new window.JavaAST.BinaryExpression(expr, operator, right);
            }
            
            return expr;
        }
        
        // Parse unary expressions
        unary() {
            if (this.match(
                window.JavaLexer.TokenType.LOGICAL_NOT,
                window.JavaLexer.TokenType.MINUS,
                window.JavaLexer.TokenType.PLUS,
                window.JavaLexer.TokenType.BITWISE_NOT
            )) {
                const operator = this.previous().value;
                const right = this.unary();
                return new window.JavaAST.UnaryExpression(operator, right, true);
            }
            
            if (this.match(
                window.JavaLexer.TokenType.INCREMENT,
                window.JavaLexer.TokenType.DECREMENT
            )) {
                const operator = this.previous().value;
                const right = this.postfix();
                return new window.JavaAST.UnaryExpression(operator, right, true);
            }
            
            return this.postfix();
        }
        
        // Parse postfix expressions
        postfix() {
            let expr = this.call();
            
            if (this.match(
                window.JavaLexer.TokenType.INCREMENT,
                window.JavaLexer.TokenType.DECREMENT
            )) {
                const operator = this.previous().value;
                expr = new window.JavaAST.UnaryExpression(operator, expr, false);
            }
            
            return expr;
        }
        
        // Parse method calls and array access
        call() {
            let expr = this.primary();
            
            while (true) {
                if (this.match(window.JavaLexer.TokenType.DOT)) {
                    const method = this.consume(window.JavaLexer.TokenType.IDENTIFIER, "Expected method name").value;
                    
                    if (this.match(window.JavaLexer.TokenType.LEFT_PAREN)) {
                        // Method call
                        const args = [];
                        if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                            do {
                                args.push(this.expression());
                            } while (this.match(window.JavaLexer.TokenType.COMMA));
                        }
                        
                        this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after arguments");
                        expr = new window.JavaAST.MethodCallExpression(expr, method, args);
                    } else {
                        // Field access
                        expr = new window.JavaAST.BinaryExpression(expr, '.', new window.JavaAST.Identifier(method));
                    }
                } else if (this.match(window.JavaLexer.TokenType.LEFT_BRACKET)) {
                    // Array access
                    const index = this.expression();
                    this.consume(window.JavaLexer.TokenType.RIGHT_BRACKET, "Expected ']' after array index");
                    expr = new window.JavaAST.ArrayAccessExpression(expr, index);
                } else {
                    break;
                }
            }
            
            return expr;
        }
        
        // Parse primary expressions
        primary() {
            if (this.match(window.JavaLexer.TokenType.STRING_LITERAL)) {
                return new window.JavaAST.Literal(this.previous().value, 'string');
            }
            
            if (this.match(window.JavaLexer.TokenType.NUMBER_LITERAL)) {
                return new window.JavaAST.Literal(this.previous().value, 'number');
            }
            
            if (this.match(window.JavaLexer.TokenType.BOOLEAN_LITERAL)) {
                return new window.JavaAST.Literal(this.previous().value, 'boolean');
            }
            
            if (this.match(window.JavaLexer.TokenType.CHAR_LITERAL)) {
                return new window.JavaAST.Literal(this.previous().value, 'char');
            }
            
            if (this.match(window.JavaLexer.TokenType.NULL_LITERAL)) {
                return new window.JavaAST.Literal(this.previous().value, 'null');
            }
            
            if (this.match(window.JavaLexer.TokenType.THIS)) {
                return new window.JavaAST.ThisExpression();
            }
            
            if (this.match(window.JavaLexer.TokenType.SUPER)) {
                return new window.JavaAST.SuperExpression();
            }
            
            if (this.match(window.JavaLexer.TokenType.NEW)) {
                return this.newExpression();
            }
            
            if (this.match(window.JavaLexer.TokenType.IDENTIFIER)) {
                const name = this.previous().value;
                
                // Check for method call without object
                if (this.match(window.JavaLexer.TokenType.LEFT_PAREN)) {
                    const args = [];
                    if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                        do {
                            args.push(this.expression());
                        } while (this.match(window.JavaLexer.TokenType.COMMA));
                    }
                    
                    this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after arguments");
                    return new window.JavaAST.MethodCallExpression(null, name, args);
                }
                
                return new window.JavaAST.Identifier(name);
            }
            
            if (this.match(window.JavaLexer.TokenType.LEFT_PAREN)) {
                const expr = this.expression();
                this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after expression");
                return expr;
            }
            
            throw new ParseError("Expected expression", this.peek());
        }
        
        // Parse base type without array dimensions
        parseBaseType() {
            if (this.match(
                window.JavaLexer.TokenType.INT,
                window.JavaLexer.TokenType.BOOLEAN,
                window.JavaLexer.TokenType.CHAR,
                window.JavaLexer.TokenType.BYTE,
                window.JavaLexer.TokenType.SHORT,
                window.JavaLexer.TokenType.LONG,
                window.JavaLexer.TokenType.FLOAT,
                window.JavaLexer.TokenType.DOUBLE
            )) {
                return this.previous().value;
            } else if (this.match(window.JavaLexer.TokenType.STRING)) {
                return 'String';
            } else if (this.match(window.JavaLexer.TokenType.IDENTIFIER)) {
                return this.previous().value;
            } else {
                throw new ParseError("Expected type", this.peek());
            }
        }

        // Parse new expression (object/array creation)
        newExpression() {
            const baseType = this.parseBaseType();
            
            if (this.match(window.JavaLexer.TokenType.LEFT_BRACKET)) {
                // Array creation
                const dimensions = [];
                dimensions.push(this.expression());
                this.consume(window.JavaLexer.TokenType.RIGHT_BRACKET, "Expected ']' after array size");
                
                // Additional dimensions (can be sized or empty)
                while (this.match(window.JavaLexer.TokenType.LEFT_BRACKET)) {
                    if (this.check(window.JavaLexer.TokenType.RIGHT_BRACKET)) {
                        // Empty dimension
                        this.advance();
                        dimensions.push(null);
                    } else {
                        // Sized dimension
                        dimensions.push(this.expression());
                        this.consume(window.JavaLexer.TokenType.RIGHT_BRACKET, "Expected ']' after array size");
                    }
                }
                
                return new window.JavaAST.ArrayCreationExpression(baseType, dimensions);
            } else if (this.match(window.JavaLexer.TokenType.LEFT_PAREN)) {
                // Object creation
                const args = [];
                if (!this.check(window.JavaLexer.TokenType.RIGHT_PAREN)) {
                    do {
                        args.push(this.expression());
                    } while (this.match(window.JavaLexer.TokenType.COMMA));
                }
                
                this.consume(window.JavaLexer.TokenType.RIGHT_PAREN, "Expected ')' after constructor arguments");
                return new window.JavaAST.ObjectCreationExpression(baseType, args);
            } else {
                throw new ParseError("Expected '(' or '[' after 'new'", this.peek());
            }
        }
        
        // Error recovery
        synchronize() {
            this.advance();
            
            while (!this.isAtEnd()) {
                if (this.previous().type === window.JavaLexer.TokenType.SEMICOLON) return;
                
                switch (this.peek().type) {
                    case window.JavaLexer.TokenType.CLASS:
                    case window.JavaLexer.TokenType.PUBLIC:
                    case window.JavaLexer.TokenType.PRIVATE:
                    case window.JavaLexer.TokenType.STATIC:
                    case window.JavaLexer.TokenType.IF:
                    case window.JavaLexer.TokenType.WHILE:
                    case window.JavaLexer.TokenType.FOR:
                    case window.JavaLexer.TokenType.DO:
                    case window.JavaLexer.TokenType.SWITCH:
                    case window.JavaLexer.TokenType.TRY:
                    case window.JavaLexer.TokenType.THROW:
                    case window.JavaLexer.TokenType.BREAK:
                    case window.JavaLexer.TokenType.CONTINUE:
                    case window.JavaLexer.TokenType.RETURN:
                        return;
                }
                
                this.advance();
            }
        }
    }
    
    // Export to window
    window.JavaParser = {
        Parser,
        ParseError
    };
})();

// ===== java-validator.js =====
(function() {
    'use strict';
    
    /**
     * Java validator that performs compile-time validation checks
     */
    class JavaValidator {
        constructor() {
            this.validationRules = new Set([
                'syntax',
                'declarations',
                'types',
                'scoping',
                'accessibility',
                'control-flow',
                'method-calls'
            ]);
        }
        
        /**
         * Validate Java source code and return validation results
         * @param {string} sourceCode - The Java source code to validate
         * @param {Object} parseResult - Optional parsed AST from java-parser
         * @returns {ValidationResult} Validation results with errors and warnings
         */
        validate(sourceCode, parseResult = null) {
            const result = new ValidationResult();
            
            if (!sourceCode || sourceCode.trim() === '') {
                return result;
            }
            
            try {
                // Parse the code if not already provided
                let ast = parseResult;
                if (!ast && window.JavaParser) {
                    const parser = new window.JavaParser.Parser(sourceCode);
                    ast = parser.parse();
                }
                
                // Run validation rules
                this.validateSyntax(sourceCode, ast, result);
                this.validateDeclarations(sourceCode, ast, result);
                this.validateTypes(sourceCode, ast, result);
                this.validateScoping(sourceCode, ast, result);
                this.validateAccessibility(sourceCode, ast, result);
                this.validateControlFlow(sourceCode, ast, result);
                this.validateMethodCalls(sourceCode, ast, result);
                
            } catch (error) {
                result.addError(1, 1, 'PARSE_ERROR', `Failed to parse code: ${error.message}`);
            }
            
            return result;
        }
        
        validateSyntax(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            
            // Check for basic syntax issues
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNum = i + 1;
                
                // Check for unmatched braces
                const openBraces = (line.match(/\{/g) || []).length;
                const closeBraces = (line.match(/\}/g) || []).length;
                
                // Check for missing semicolons on non-block statements
                if (line.trim() && 
                    !line.trim().endsWith('{') && 
                    !line.trim().endsWith('}') && 
                    !line.trim().endsWith(';') &&
                    !line.trim().startsWith('//') &&
                    !line.trim().startsWith('/*') &&
                    !line.trim().startsWith('*') &&
                    !line.trim().startsWith('import') &&
                    !line.trim().startsWith('package') &&
                    line.includes('=') || line.includes('(')) {
                    
                    // Skip method/class declarations and control structures
                    if (!line.match(/\b(class|interface|enum|public|private|protected|static|final|abstract|if|else|while|for|do|switch|try|catch|finally)\b/)) {
                        result.addWarning(lineNum, line.length, 'MISSING_SEMICOLON', 'Statement should end with semicolon');
                    }
                }
            }
        }
        
        validateDeclarations(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            const declaredVariables = new Set();
            const declaredMethods = new Set();
            const declaredClasses = new Set();
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;
                
                // Check class declarations
                const classMatch = line.match(/\b(class|interface|enum)\s+(\w+)/);
                if (classMatch) {
                    const className = classMatch[2];
                    if (declaredClasses.has(className)) {
                        result.addError(lineNum, line.indexOf(className), 'DUPLICATE_CLASS', `Class '${className}' is already declared`);
                    } else {
                        declaredClasses.add(className);
                    }
                }
                
                // Check method declarations
                const methodMatch = line.match(/\b(\w+)\s+(\w+)\s*\(/);
                if (methodMatch && !line.includes('=')) {
                    const methodName = methodMatch[2];
                    const methodSignature = `${methodName}`;
                    if (declaredMethods.has(methodSignature)) {
                        result.addWarning(lineNum, line.indexOf(methodName), 'DUPLICATE_METHOD', `Method '${methodName}' may be overloaded`);
                    } else {
                        declaredMethods.add(methodSignature);
                    }
                }
                
                // Check variable declarations
                const varMatch = line.match(/\b(int|String|boolean|double|float|char|long|short|byte)\s+(\w+)/);
                if (varMatch) {
                    const varName = varMatch[2];
                    if (declaredVariables.has(varName)) {
                        result.addError(lineNum, line.indexOf(varName), 'DUPLICATE_VARIABLE', `Variable '${varName}' is already declared`);
                    } else {
                        declaredVariables.add(varName);
                    }
                }
            }
        }
        
        validateTypes(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            const knownTypes = new Set(['int', 'String', 'boolean', 'double', 'float', 'char', 'long', 'short', 'byte', 'void', 'Object']);
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const lineNum = i + 1;
                
                // Check type assignments
                const assignMatch = line.match(/(\w+)\s+(\w+)\s*=\s*(.+);/);
                if (assignMatch) {
                    const type = assignMatch[1];
                    const varName = assignMatch[2];
                    const value = assignMatch[3].trim();
                    
                    // Basic type checking
                    if (type === 'int' && !value.match(/^\d+$/) && !value.match(/^\w+$/)) {
                        if (value.includes('"')) {
                            result.addError(lineNum, line.indexOf(value), 'TYPE_MISMATCH', `Cannot assign String to int variable '${varName}'`);
                        }
                    }
                    
                    if (type === 'String' && value.match(/^\d+$/) && !value.includes('"')) {
                        result.addWarning(lineNum, line.indexOf(value), 'TYPE_WARNING', `Assigning numeric literal to String variable '${varName}'`);
                    }
                }
            }
        }
        
        validateScoping(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            const scopeStack = [];
            const variableScopes = new Map();
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;
                
                // Track scope depth
                const braceOpen = (line.match(/\{/g) || []).length;
                const braceClose = (line.match(/\}/g) || []).length;
                
                for (let j = 0; j < braceOpen; j++) {
                    scopeStack.push(lineNum);
                }
                
                // Check variable usage before declaration
                const usageMatch = line.match(/\b(\w+)\s*[=+\-*/]/);
                if (usageMatch && !line.includes('int ') && !line.includes('String ')) {
                    const varName = usageMatch[1];
                    if (!variableScopes.has(varName) && !['System', 'Math', 'String'].includes(varName)) {
                        result.addError(lineNum, line.indexOf(varName), 'UNDEFINED_VARIABLE', `Variable '${varName}' is not defined`);
                    }
                }
                
                // Track variable declarations
                const declMatch = line.match(/\b(int|String|boolean|double|float|char)\s+(\w+)/);
                if (declMatch) {
                    const varName = declMatch[2];
                    variableScopes.set(varName, scopeStack.length);
                }
                
                for (let j = 0; j < braceClose; j++) {
                    if (scopeStack.length > 0) {
                        scopeStack.pop();
                    }
                }
            }
        }
        
        validateAccessibility(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;
                
                // Check for multiple access modifiers
                const accessModifiers = line.match(/\b(public|private|protected)\b/g);
                if (accessModifiers && accessModifiers.length > 1) {
                    result.addError(lineNum, line.indexOf(accessModifiers[1]), 'MULTIPLE_ACCESS_MODIFIERS', 'Multiple access modifiers are not allowed');
                }
                
                // Check for proper method access
                if (line.includes('main') && line.includes('(')) {
                    if (!line.includes('public static')) {
                        result.addWarning(lineNum, line.indexOf('main'), 'MAIN_METHOD_ACCESS', 'main method should be public static');
                    }
                }
            }
        }
        
        validateControlFlow(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;
                
                // Check for unreachable code after return
                if (line.includes('return') && i < lines.length - 1) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine && !nextLine.startsWith('}') && !nextLine.startsWith('//')) {
                        result.addWarning(i + 2, 1, 'UNREACHABLE_CODE', 'Unreachable code after return statement');
                    }
                }
                
                // Check for missing return in non-void methods
                const methodMatch = line.match(/\b(\w+)\s+(\w+)\s*\([^)]*\)\s*\{/);
                if (methodMatch && !methodMatch[1].includes('void')) {
                    const methodEnd = this.findMethodEnd(lines, i);
                    const hasReturn = lines.slice(i, methodEnd).some(l => l.includes('return'));
                    if (!hasReturn) {
                        result.addError(lineNum, line.indexOf(methodMatch[2]), 'MISSING_RETURN', `Method '${methodMatch[2]}' must return a value`);
                    }
                }
            }
        }
        
        validateMethodCalls(sourceCode, ast, result) {
            const lines = sourceCode.split('\n');
            const declaredMethods = new Set(['main', 'println', 'print']);
            
            // First pass: collect method declarations
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const methodMatch = line.match(/\b(\w+)\s+(\w+)\s*\(/);
                if (methodMatch && !line.includes('=')) {
                    declaredMethods.add(methodMatch[2]);
                }
            }
            
            // Second pass: check method calls
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;
                
                const callMatch = line.match(/(\w+)\s*\(/);
                if (callMatch && !line.match(/\b(if|while|for|switch)\b/)) {
                    const methodName = callMatch[1];
                    if (!declaredMethods.has(methodName) && !['System', 'Math', 'String'].includes(methodName)) {
                        result.addError(lineNum, line.indexOf(methodName), 'UNDEFINED_METHOD', `Method '${methodName}' is not defined`);
                    }
                }
            }
        }
        
        findMethodEnd(lines, startIndex) {
            let braceCount = 0;
            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i];
                braceCount += (line.match(/\{/g) || []).length;
                braceCount -= (line.match(/\}/g) || []).length;
                if (braceCount === 0 && i > startIndex) {
                    return i;
                }
            }
            return lines.length;
        }
    }
    
    /**
     * Validation result container
     */
    class ValidationResult {
        constructor() {
            this.errors = [];
            this.warnings = [];
            this.info = [];
        }
        
        addError(line, column, code, message) {
            this.errors.push(new ValidationIssue('error', line, column, code, message));
        }
        
        addWarning(line, column, code, message) {
            this.warnings.push(new ValidationIssue('warning', line, column, code, message));
        }
        
        addInfo(line, column, code, message) {
            this.info.push(new ValidationIssue('info', line, column, code, message));
        }
        
        hasErrors() {
            return this.errors.length > 0;
        }
        
        hasWarnings() {
            return this.warnings.length > 0;
        }
        
        hasIssues() {
            return this.hasErrors() || this.hasWarnings();
        }
        
        getAllIssues() {
            return [...this.errors, ...this.warnings, ...this.info];
        }
        
        getIssueCount() {
            return this.errors.length + this.warnings.length + this.info.length;
        }
        
        clear() {
            this.errors = [];
            this.warnings = [];
            this.info = [];
        }
    }
    
    /**
     * Individual validation issue
     */
    class ValidationIssue {
        constructor(severity, line, column, code, message) {
            this.severity = severity; // 'error', 'warning', 'info'
            this.line = line;
            this.column = column;
            this.code = code;
            this.message = message;
            this.timestamp = new Date();
        }
        
        toString() {
            return `${this.severity.toUpperCase()}: Line ${this.line}, Column ${this.column}: ${this.message} (${this.code})`;
        }
    }
    
    // Export to window
    window.JavaValidator = {
        JavaValidator,
        ValidationResult,
        ValidationIssue
    };
})();

// ===== java-plugin.js =====
(function() {
    'use strict';
    
    class JavaPlugin extends window.EditorPlugin {
        constructor() {
            super('java');
            this.colorScheme = {
                keyword: '#569cd6',    // Light blue for keywords (class, public, if, etc.)
                string: '#ce9178',     // Light orange for strings
                number: '#b5cea8',     // Light green for numbers
                comment: '#6a9955',    // Green for comments  
                identifier: '#d4d4d4', // Light gray for variables
                operator: '#d4d4d4',   // Light gray for operators
                delimiter: '#d4d4d4'   // Light gray for punctuation
            };
            
            // Initialize validator if available
            this.initializeValidator();
        }
        
        initializeValidator() {
            if (window.JavaValidator && window.JavaValidator.JavaValidator) {
                this.setValidator(new window.JavaValidator.JavaValidator());
            }
        }
        
        highlight(sourceCode) {
            if (!sourceCode || sourceCode.trim() === '') {
                return '';
            }
            
            try {
                // Use the Java lexer to tokenize
                const lexer = new window.JavaLexer.Lexer(sourceCode);
                const tokens = lexer.tokenize();
                
                return this.tokensToHtml(tokens, sourceCode);
            } catch (error) {
                console.error('Java highlighting failed:', error);
                console.error('Source code causing error:', sourceCode);
                console.error('Error details:', {
                    message: error.message,
                    line: error.line || 'unknown',
                    column: error.column || 'unknown',
                    stack: error.stack
                });
                
                // Try to identify problematic content
                const lines = sourceCode.split('\n');
                console.error('Source code lines:', lines.map((line, i) => `${i + 1}: ${line}`));
                
                // Fallback to plain text
                return this.escapeHtml(sourceCode);
            }
        }
        
        tokensToHtml(tokens, originalText) {
            let html = '';
            let lastPosition = 0;
            
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                
                if (token.type === window.JavaLexer.TokenType.EOF) {
                    break;
                }
                
                // Calculate token position in original text
                const tokenStart = this.findTokenPosition(originalText, token, lastPosition);
                
                // Add any text between last token and this token
                if (tokenStart > lastPosition) {
                    const betweenText = originalText.slice(lastPosition, tokenStart);
                    html += this.escapeHtml(betweenText);
                }
                
                // Add the highlighted token
                const color = this.getTokenColor(token.type);
                const originalTokenText = token.value || this.getTokenDisplay(token.type);
                const tokenText = this.escapeHtml(originalTokenText);
                
                // Always wrap tokens in spans for consistent highlighting
                // Special characters get default styling but still get wrapped
                if (color) {
                    html += `<span style="color: ${color}">${tokenText}</span>`;
                } else {
                    // Use default color for operators and delimiters
                    html += `<span style="color: ${this.colorScheme.delimiter}">${tokenText}</span>`;
                }
                
                lastPosition = tokenStart + originalTokenText.length;
            }
            
            // Add any remaining text
            if (lastPosition < originalText.length) {
                html += this.escapeHtml(originalText.slice(lastPosition));
            }
            
            return html;
        }
        
        findTokenPosition(text, token, startFrom) {
            // Simple approach: find the token value starting from the last position
            const searchValue = token.value || this.getTokenDisplay(token.type);
            const position = text.indexOf(searchValue, startFrom);
            return position >= 0 ? position : startFrom;
        }
        
        getTokenDisplay(tokenType) {
            const displays = {
                [window.JavaLexer.TokenType.LEFT_PAREN]: '(',
                [window.JavaLexer.TokenType.RIGHT_PAREN]: ')',
                [window.JavaLexer.TokenType.LEFT_BRACE]: '{',
                [window.JavaLexer.TokenType.RIGHT_BRACE]: '}',
                [window.JavaLexer.TokenType.LEFT_BRACKET]: '[',
                [window.JavaLexer.TokenType.RIGHT_BRACKET]: ']',
                [window.JavaLexer.TokenType.SEMICOLON]: ';',
                [window.JavaLexer.TokenType.COMMA]: ',',
                [window.JavaLexer.TokenType.DOT]: '.',
                [window.JavaLexer.TokenType.PLUS]: '+',
                [window.JavaLexer.TokenType.MINUS]: '-',
                [window.JavaLexer.TokenType.MULTIPLY]: '*',
                [window.JavaLexer.TokenType.DIVIDE]: '/',
                [window.JavaLexer.TokenType.ASSIGN]: '=',
                [window.JavaLexer.TokenType.EQUALS]: '==',
                [window.JavaLexer.TokenType.NOT_EQUALS]: '!=',
                [window.JavaLexer.TokenType.LESS_THAN]: '<',
                [window.JavaLexer.TokenType.GREATER_THAN]: '>',
                [window.JavaLexer.TokenType.NEWLINE]: '\n',
                [window.JavaLexer.TokenType.WHITESPACE]: ' '
            };
            return displays[tokenType] || '';
        }
        
        getTokenColor(tokenType) {
            const { TokenType } = window.JavaLexer;
            
            // Keywords
            if ([TokenType.CLASS, TokenType.PUBLIC, TokenType.PRIVATE, TokenType.STATIC,
                 TokenType.VOID, TokenType.INT, TokenType.STRING, TokenType.IF,
                 TokenType.ELSE, TokenType.WHILE, TokenType.FOR, TokenType.RETURN].includes(tokenType)) {
                return this.colorScheme.keyword;
            }
            
            // Literals  
            if (tokenType === TokenType.STRING_LITERAL) {
                return this.colorScheme.string;
            }
            
            if (tokenType === TokenType.NUMBER_LITERAL) {
                return this.colorScheme.number;
            }
            
            // Operators
            if ([TokenType.PLUS, TokenType.MINUS, TokenType.MULTIPLY, TokenType.DIVIDE,
                 TokenType.ASSIGN, TokenType.EQUALS, TokenType.NOT_EQUALS,
                 TokenType.LESS_THAN, TokenType.GREATER_THAN].includes(tokenType)) {
                return this.colorScheme.operator;
            }
            
            // Identifiers
            if (tokenType === TokenType.IDENTIFIER) {
                return this.colorScheme.identifier;
            }
            
            // Delimiters and punctuation get explicit delimiter color
            if ([TokenType.LEFT_PAREN, TokenType.RIGHT_PAREN, TokenType.LEFT_BRACE, TokenType.RIGHT_BRACE,
                 TokenType.LEFT_BRACKET, TokenType.RIGHT_BRACKET, TokenType.SEMICOLON, TokenType.COMMA,
                 TokenType.DOT].includes(tokenType)) {
                return this.colorScheme.delimiter;
            }
            
            // Comments
            if (tokenType === TokenType.COMMENT) {
                return this.colorScheme.comment;
            }
            
            // Default for unspecified tokens
            return this.colorScheme.delimiter;
        }
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        getSupportedExtensions() {
            return ['.java'];
        }
        
        getDisplayName() {
            return 'Java';
        }
    }
    
    // Export to window
    window.JavaPlugin = JavaPlugin;
})();

// ===== server.js =====
// Server communication module for DMDC GPT
// Handles clipboard-based communication with Java server

const ServerMessageType = {
    DOCX_TO_JSON: 'DOCX_TO_JSON'
};

class ServerCommunicator {
    constructor() {
        this.SERVER_INDICATOR = '##DMDCGPT_SERVER##';
        this.CLIENT_INDICATOR = '##DMDCGPT_CLIENT##';
        this.MESSAGE_SEPARATOR = '##MSG_SEP##';
    }

    /**
     * Send a message to the server and wait for response
     * @param {string} type - Message type (use ServerMessageType enum)
     * @param {string} content - Message content
     * @returns {Promise<string>} Server response content
     */
    async sendMessage(type, content) {
        try {
            // Save original clipboard content
            const originalClipboard = await navigator.clipboard.readText();
            
            // Create server message
            const serverMessage = this._createServerMessage(type, content, originalClipboard);
            
            // Write to clipboard
            await navigator.clipboard.writeText(serverMessage);
            
            // Poll for response
            const response = await this._pollForResponse(originalClipboard);
            
            // Restore original clipboard
            await navigator.clipboard.writeText(originalClipboard);
            
            return response;
            
        } catch (error) {
            console.error('Server communication error:', error);
            throw new Error(`Server communication failed: ${error.message}`);
        }
    }

    /**
     * Create a server message in the expected format
     * @private
     */
    _createServerMessage(type, content, originalClipboard) {
        return `${this.SERVER_INDICATOR}TYPE:${type}\n${content}${this.MESSAGE_SEPARATOR}${originalClipboard}`;
    }

    /**
     * Poll clipboard for server response
     * @private
     */
    async _pollForResponse(originalClipboard, maxAttempts = 30, pollInterval = 1000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await this._sleep(pollInterval);
            
            try {
                const clipboardContent = await navigator.clipboard.readText();
                
                // Check if it's a client response
                if (clipboardContent.startsWith(this.CLIENT_INDICATOR)) {
                    const parsed = this._parseClientMessage(clipboardContent);
                    if (parsed) {
                        return parsed.content;
                    }
                }
                
                // If clipboard was restored to original, server might have processed but failed
                if (clipboardContent === originalClipboard && attempt > 5) {
                    throw new Error('Server may have processed request but no response received');
                }
                
            } catch (clipboardError) {
                console.warn(`Clipboard read attempt ${attempt + 1} failed:`, clipboardError);
            }
        }
        
        throw new Error(`Server response timeout after ${maxAttempts} attempts`);
    }

    /**
     * Parse client response message
     * @private
     */
    _parseClientMessage(clipboardContent) {
        if (!clipboardContent.startsWith(this.CLIENT_INDICATOR)) {
            return null;
        }

        const messageSeparatorIndex = clipboardContent.indexOf(this.MESSAGE_SEPARATOR);
        if (messageSeparatorIndex === -1) {
            return null;
        }

        const messageContent = clipboardContent.substring(
            this.CLIENT_INDICATOR.length, 
            messageSeparatorIndex
        );

        const currentClipboard = clipboardContent.substring(
            messageSeparatorIndex + this.MESSAGE_SEPARATOR.length
        );

        // Parse type and content from message
        let type = '';
        let content = messageContent;
        
        const newlineIndex = messageContent.indexOf('\n');
        if (newlineIndex > 0 && messageContent.substring(0, newlineIndex).includes(':')) {
            const header = messageContent.substring(0, newlineIndex);
            if (header.startsWith('TYPE:')) {
                type = header.substring(5);
                content = messageContent.substring(newlineIndex + 1);
            }
        }

        return {
            type: type,
            content: content,
            currentClipboard: currentClipboard
        };
    }

    /**
     * Sleep utility
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create singleton instance
const serverCommunicator = new ServerCommunicator();

// Export for use in other modules
window.ServerCommunicator = {
    MessageType: ServerMessageType,
    
    /**
     * Send DOCX content to server for JSON conversion
     * @param {string} base64DocxContent - Base64 encoded DOCX file
     * @returns {Promise<string>} JSON response
     */
    async convertDocxToJson(base64DocxContent) {
        return await serverCommunicator.sendMessage(
            ServerMessageType.DOCX_TO_JSON, 
            base64DocxContent
        );
    },

    /**
     * Generic message sender
     * @param {string} type - Message type
     * @param {string} content - Message content
     * @returns {Promise<string>} Server response
     */
    async sendMessage(type, content) {
        return await serverCommunicator.sendMessage(type, content);
    }
};

// ===== api-manager.js =====
(function() {
    'use strict';

    class StreamingAPIManager {
        constructor() {
            this.logger = window.StreamingChatLogger;
            this.config = window.StreamingChatConfig;
            this.utils = window.StreamingChatUtils;
            
            this.logger.log('StreamingAPI', 'Initializing Streaming API Manager');
            this.token = this.getAuthToken();
            this.isReady = !!this.token;
            this.activityTimeout = null;
            
            if (this.token) {
                this.logger.log('StreamingAPI', 'Auth token found', { 
                    tokenPreview: this.token.substring(0, 20) + '...' 
                });
            } else {
                this.logger.error('StreamingAPI', 'No auth token found in localStorage');
            }
        }

        getAuthToken() {
            try {
                const token = localStorage.getItem('token');
                return token;
            } catch (e) {
                this.logger.error('StreamingAPI', 'Failed to retrieve auth token', e);
                return null;
            }
        }

        checkAuthToken() {
            const currentToken = this.getAuthToken();
            if (!currentToken) {
                this.isReady = false;
                return false;
            }
            
            if (currentToken !== this.token) {
                this.logger.log('StreamingAPI', 'Auth token updated');
                this.token = currentToken;
            }
            
            this.isReady = true;
            return true;
        }

        resetActivityTimeout() {
            if (this.activityTimeout) {
                clearTimeout(this.activityTimeout);
            }
            
            this.activityTimeout = setTimeout(() => {
                this.logger.error('StreamingAPI', 'Overall timeout reached - 10 minutes of no activity');
                throw new Error('Request timeout - 10 minutes of no activity');
            }, this.config.OVERALL_TIMEOUT);
        }

        clearActivityTimeout() {
            if (this.activityTimeout) {
                clearTimeout(this.activityTimeout);
                this.activityTimeout = null;
            }
        }

        createStep1Payload(userMessage, conversationHistory = []) {
            this.logger.log('StreamingAPI', 'Creating Step 1 payload', { 
                messageLength: userMessage.length,
                historyLength: conversationHistory.length
            });

            const timestamp13 = this.utils.get13DigitTimestamp();
            const timestamp10 = this.utils.get10DigitTimestamp();
            
            // Build messages array with proper parent/child relationships
            const messages = [];
            let previousMessageId = null;
            
            // Add conversation history first
            conversationHistory.forEach((historyMsg, index) => {
                const historyMsgId = this.utils.generateUUID();
                const message = {
                    childrenIds: [],
                    content: historyMsg.content,
                    id: historyMsgId,
                    models: ["Anthropic Claude 4 Sonnet"],
                    parentId: previousMessageId,
                    role: historyMsg.role,
                    timestamp: timestamp10
                };
                
                // Update previous message's childrenIds
                if (previousMessageId) {
                    const previousMessage = messages.find(msg => msg.id === previousMessageId);
                    if (previousMessage) {
                        previousMessage.childrenIds.push(historyMsgId);
                    }
                }
                
                messages.push(message);
                previousMessageId = historyMsgId;
            });
            
            // Add current user message
            const userMessageId = this.utils.generateUUID();
            const userMessageObj = {
                childrenIds: [],
                content: userMessage,
                id: userMessageId,
                models: ["Anthropic Claude 4 Sonnet"],
                parentId: previousMessageId,
                role: "user",
                timestamp: timestamp10
            };
            
            // Update previous message's childrenIds
            if (previousMessageId) {
                const previousMessage = messages.find(msg => msg.id === previousMessageId);
                if (previousMessage) {
                    previousMessage.childrenIds.push(userMessageId);
                }
            }
            
            messages.push(userMessageObj);
            
            // Create history object with messages keyed by ID
            const historyMessages = {};
            messages.forEach(msg => {
                historyMessages[msg.id] = msg;
            });
            
            const payload = {
                chat: {
                    params: {},
                    tags: [],
                    timestamp: timestamp13,
                    title: "Chat Pending",
                    models: ["Anthropic Claude 4 Sonnet"],
                    messages: messages,
                    id: "",
                    history: {
                        currentId: userMessageId,
                        messages: historyMessages
                    }
                }
            };

            this.logger.log('StreamingAPI', 'Step 1 payload created', { 
                userMessageId, 
                timestamp13,
                totalMessages: messages.length,
                parentChildChain: messages.map(m => ({ id: m.id, parentId: m.parentId, role: m.role }))
            });
            
            return payload;
        }

        async step1CreateConversation(userMessage, conversationHistory = []) {
            this.logger.log('StreamingAPI', 'STEP 1: Creating conversation');
            
            if (!this.checkAuthToken()) {
                throw new Error('No authentication token available');
            }

            this.resetActivityTimeout();

            try {
                const payload = this.createStep1Payload(userMessage, conversationHistory);
                
                this.logger.log('StreamingAPI', 'Sending Step 1 request', { 
                    endpoint: this.config.NEW_CHAT_ENDPOINT 
                });

                const response = await fetch(this.config.NEW_CHAT_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(payload)
                });

                this.logger.log('StreamingAPI', 'Step 1 response received', { 
                    status: response.status,
                    statusText: response.statusText
                });

                if (response.status === 401) {
                    throw new Error('Authentication failed. Token may be expired.');
                } else if (!response.ok) {
                    throw new Error(`Step 1 failed: ${response.status} ${response.statusText}`);
                }

                const responseData = await response.json();
                this.logger.log('StreamingAPI', 'Step 1 successful', { 
                    conversationId: responseData.id,
                    userId: responseData.user_id || 'not provided'
                });

                return {
                    conversationId: responseData.id,
                    userId: responseData.user_id,
                    userMessageId: payload.chat.messages[payload.chat.messages.length - 1].id,
                    payload: payload
                };

            } catch (error) {
                this.clearActivityTimeout();
                this.logger.error('StreamingAPI', 'Step 1 failed', error);
                throw error;
            }
        }

        async step2AddAssistantSlot(conversationId, step1Payload) {
            this.logger.log('StreamingAPI', 'STEP 2: Add assistant message slot (skipping GET)', { 
                conversationId 
            });

            try {
                const assistantMessageId = this.utils.generateUUID();
                const timestamp10 = this.utils.get10DigitTimestamp();
                
                // Find the last message from Step 1 payload for parentId
                const messages = step1Payload.chat.messages || [];
                const lastMessage = messages[messages.length - 1];
                const parentId = lastMessage ? lastMessage.id : null;
                
                this.logger.log('StreamingAPI', 'Creating assistant message from Step 1 data', {
                    assistantMessageId,
                    parentId,
                    timestamp10,
                    step1MessageCount: messages.length
                });

                // Create the empty assistant message
                const assistantMessage = {
                    childrenIds: [],
                    content: "",
                    id: assistantMessageId,
                    models: ["Anthropic Claude 4 Sonnet"],
                    parentId: parentId,
                    role: "assistant",
                    timestamp: timestamp10
                };

                // Build conversation structure based on Step 1 payload
                const conversationData = {
                    archived: false,
                    chat: {
                        files: [],
                        history: {
                            currentId: assistantMessageId,
                            messages: JSON.parse(JSON.stringify(step1Payload.chat.history.messages))
                        },
                        id: conversationId,
                        messages: [...step1Payload.chat.messages],
                        models: ["Anthropic Claude 4 Sonnet"],
                        params: {},
                        tags: [],
                        timestamp: step1Payload.chat.timestamp,
                        title: "Chat Pending"
                    },
                    created_at: timestamp10,
                    folder_id: null,
                    id: conversationId,
                    meta: {},
                    pinned: false,
                    share_id: null,
                    title: "Chat Pending",
                    updated_at: timestamp10,
                    user_id: null, // Will be filled by server
                    workspace_id: null,
                    workspace_name: null,
                    workspace_type: null
                };
                
                // Add assistant message to messages array
                conversationData.chat.messages.push(assistantMessage);
                
                // Add to history.messages
                conversationData.chat.history.messages[assistantMessageId] = assistantMessage;
                
                // Update parent message's childrenIds if it exists
                if (parentId && conversationData.chat.history.messages[parentId]) {
                    if (!conversationData.chat.history.messages[parentId].childrenIds) {
                        conversationData.chat.history.messages[parentId].childrenIds = [];
                    }
                    conversationData.chat.history.messages[parentId].childrenIds.push(assistantMessageId);
                    
                    // Also update in messages array
                    const parentInMessages = conversationData.chat.messages.find(msg => msg.id === parentId);
                    if (parentInMessages) {
                        if (!parentInMessages.childrenIds) {
                            parentInMessages.childrenIds = [];
                        }
                        parentInMessages.childrenIds.push(assistantMessageId);
                    }
                }

                this.logger.log('StreamingAPI', 'Step 2: Posting conversation with assistant slot', {
                    totalMessages: conversationData.chat.messages.length,
                    assistantMessageId
                });

                // POST the conversation with assistant message slot
                const postResponse = await fetch(`${this.config.GET_CHAT_ENDPOINT}${conversationId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(conversationData)
                });

                this.logger.log('StreamingAPI', 'Step 2 response received', { 
                    status: postResponse.status
                });

                if (!postResponse.ok) {
                    throw new Error(`Step 2 failed: ${postResponse.status} ${postResponse.statusText}`);
                }

                const postResponseData = await postResponse.json();
                this.logger.log('StreamingAPI', 'Step 2 complete - assistant message slot created', { 
                    assistantMessageId
                });

                return {
                    assistantMessageId: assistantMessageId,
                    conversationData: conversationData
                };

            } catch (error) {
                this.logger.error('StreamingAPI', 'Step 2 failed', error);
                throw error;
            }
        }

        createStep3Payload(conversationId, assistantMessageId, messages, projectContext = null) {
            this.logger.log('StreamingAPI', 'Creating Step 3 payload', { 
                conversationId,
                assistantMessageId,
                messageCount: messages.length,
                hasProjectContext: !!projectContext
            });

            // Build system message content
            let systemContent = `You are an AI assistant with access to file system tools. When the user asks questions about code, files, or wants to search for information, use the available tools.

Available tools:
1. read_file - Read the contents of a specific file
2. write_file - Write content to a file (creates or overwrites)
3. search_files - Search for text across multiple files

Tool usage format:
<tool_use>{"tool_type": "read_file", "file_path": "/path/to/file"}</tool_use>
<tool_use>{"tool_type": "write_file", "file_path": "/path/to/file", "content": "file content here"}</tool_use>
<tool_use>{"tool_type": "search_files", "query": "search term"}</tool_use>

Use tools when:
- You need to read file contents to understand, analyze, or answer questions about code
- You need to write or save code, configurations, or other content to files
- You need to search across files to find functions, patterns, or specific text
- You want to examine existing code structure before making modifications
- You need to create new files as part of implementing features or solutions
- You want to understand what files exist and their relationships

IMPORTANT RESPONSE RULES:
- If you need to use tools, send ONLY the tool uses (starting with <tool_use>)
- If you want to respond with a message, send ONLY the message text (no tool uses)
- NEVER mix tool uses and message text in the same response
- Always end the conversation with a final message response after all tools are complete
- You can send multiple tool uses in one response, but no message text with them

Always use the exact tool_use format shown above. The tools will search across the currently active project files.`;

            // Add project file structure for new conversations
            if (projectContext && projectContext.isFirstMessage && projectContext.files) {
                const tree = this.utils.buildFileTree(projectContext.files, 2);
                const treeText = this.utils.renderFileTreeText(tree);
                
                systemContent += `

CURRENT PROJECT FILES (2 levels deep):
\`\`\`
${treeText.trim()}
\`\`\`

Use this file structure to understand the project layout. You can read any of these files or search across them using the tools above.`;
                
                this.logger.log('StreamingAPI', 'Added project file structure to system message', {
                    fileCount: projectContext.files.length,
                    treeLines: treeText.split('\n').length
                });
            }

            // Create system message with tool instructions
            const systemMessage = {
                role: 'system',
                content: systemContent
            };

            // Convert messages to simplified format (content + role only)
            const simplifiedMessages = [
                systemMessage,
                ...messages.map(msg => ({
                    content: msg.content,
                    role: msg.role
                }))
            ];

            const payload = {
                background_tasks: {
                    title_generation: true,
                    tags_generation: true
                },
                chat_id: conversationId,
                features: {
                    web_search: false
                },
                id: assistantMessageId,
                messages: simplifiedMessages,
                model: "Anthropic Claude 4 Sonnet",
                params: {},
                session_id: this.config.SESSION_ID,
                stream: true
            };

            this.logger.log('StreamingAPI', 'Step 3 payload created', { 
                originalMessageCount: messages.length,
                totalWithSystem: simplifiedMessages.length 
            });

            return payload;
        }

        async step3StreamResponse(conversationId, assistantMessageId, messages, onChunk, onComplete, onError, projectContext = null) {
            this.logger.log('StreamingAPI', 'STEP 3: Starting response stream', { 
                conversationId,
                assistantMessageId 
            });

            try {
                const payload = this.createStep3Payload(conversationId, assistantMessageId, messages, projectContext);

                this.logger.log('StreamingAPI', 'Sending Step 3 request', { 
                    endpoint: this.config.COMPLETIONS_ENDPOINT 
                });

                const response = await fetch(this.config.COMPLETIONS_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(payload)
                });

                this.logger.log('StreamingAPI', 'Step 3 response received', { 
                    status: response.status,
                    statusText: response.statusText
                });

                if (!response.ok) {
                    throw new Error(`Step 3 failed: ${response.status} ${response.statusText}`);
                }

                if (!response.body) {
                    throw new Error('Step 3 - no response body for streaming');
                }

                this.logger.log('StreamingAPI', 'Step 3 - starting to read SSE stream');

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let chunkCount = 0;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) {
                            this.logger.log('StreamingAPI', 'Step 3 - stream ended', { totalChunks: chunkCount });
                            break;
                        }

                        // Reset activity timeout on each chunk
                        this.resetActivityTimeout();

                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;

                        // Process complete lines
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            
                            if (trimmedLine.startsWith('data: ')) {
                                const jsonStr = trimmedLine.slice(6); // Remove 'data: '
                                
                                if (jsonStr === '[DONE]') {
                                    this.logger.log('StreamingAPI', 'Step 3 - received [DONE] marker');
                                    onComplete();
                                    return;
                                }

                                try {
                                    const data = JSON.parse(jsonStr);
                                    chunkCount++;
                                    
                                    this.logger.log('StreamingAPI', `Step 3 - chunk ${chunkCount}`, { 
                                        hasChoices: !!data.choices,
                                        choiceCount: data.choices?.length || 0
                                    });

                                    if (data.choices && data.choices.length > 0) {
                                        const choice = data.choices[0];
                                        
                                        if (choice.finish_reason === 'stop') {
                                            this.logger.log('StreamingAPI', 'Step 3 - received finish_reason: stop');
                                            onComplete();
                                            return;
                                        }
                                        
                                        if (choice.delta && choice.delta.content) {
                                            this.logger.log('StreamingAPI', `Step 3 - content chunk: "${choice.delta.content.substring(0, 50)}..."`);
                                            onChunk(choice.delta.content);
                                        }
                                    }
                                    
                                } catch (parseError) {
                                    this.logger.warn('StreamingAPI', 'Step 3 - failed to parse chunk', { 
                                        jsonStr: jsonStr.substring(0, 100),
                                        error: parseError.message 
                                    });
                                }
                            }
                        }
                    }

                    // If we reach here, the stream ended without [DONE] or finish_reason
                    this.logger.log('StreamingAPI', 'Step 3 - stream ended naturally');
                    onComplete();

                } catch (streamError) {
                    this.logger.error('StreamingAPI', 'Step 3 - stream reading failed', streamError);
                    onError(streamError);
                } finally {
                    try {
                        reader.releaseLock();
                    } catch (e) {
                        // Ignore lock release errors
                    }
                }

            } catch (error) {
                this.logger.error('StreamingAPI', 'Step 3 failed', error);
                onError(error);
            } finally {
                this.clearActivityTimeout();
            }
        }

        async sendMessage(userMessage, conversationHistory = [], existingConversationId = null, onChunk, onComplete, onError, onProgress = null, projectContext = null) {
            const isNewConversation = !existingConversationId;
            
            this.logger.log('StreamingAPI', 'Starting message flow', { 
                userMessage: userMessage.substring(0, 50) + '...',
                isNewConversation,
                existingConversationId,
                historyLength: conversationHistory.length
            });

            try {
                let conversationId;
                let step2Result;
                
                if (isNewConversation) {
                    this.logger.log('StreamingAPI', 'NEW CONVERSATION: Running Step 1 + Step 2');
                    
                    // Step 1: Create conversation
                    if (onProgress) onProgress(1, 4, 'Creating conversation...');
                    const step1Result = await this.step1CreateConversation(userMessage, conversationHistory);
                    conversationId = step1Result.conversationId;
                    
                    // Step 2: Add assistant message slot (no GET needed)
                    if (onProgress) onProgress(2, 4, 'Adding assistant message slot...');
                    step2Result = await this.step2AddAssistantSlot(
                        step1Result.conversationId,
                        step1Result.payload
                    );
                } else {
                    this.logger.log('StreamingAPI', 'EXISTING CONVERSATION: Running Step 2 only');
                    conversationId = existingConversationId;
                    
                    // For existing conversations, we need to get current state and add messages
                    this.logger.log('StreamingAPI', 'Getting existing conversation for continuation');
                    const getUrl = `${this.config.GET_CHAT_ENDPOINT}${conversationId}`;
                    
                    const getResponse = await fetch(getUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });

                    if (!getResponse.ok) {
                        throw new Error(`Failed to get existing conversation: ${getResponse.status} ${getResponse.statusText}`);
                    }

                    const conversationData = await getResponse.json();
                    
                    // Create a step1-like payload from the existing conversation + new user message
                    const userMessageId = this.utils.generateUUID();
                    const timestamp10 = this.utils.get10DigitTimestamp();
                    const lastMessage = conversationData.chat.messages[conversationData.chat.messages.length - 1];

                    const newUserMessage = {
                        childrenIds: [],
                        content: userMessage,
                        id: userMessageId,
                        models: ["Anthropic Claude 4 Sonnet"],
                        parentId: lastMessage ? lastMessage.id : null,
                        role: "user",
                        timestamp: timestamp10
                    };

                    // Add user message to conversation
                    conversationData.chat.messages.push(newUserMessage);
                    conversationData.chat.history.messages[userMessageId] = newUserMessage;
                    conversationData.chat.history.currentId = userMessageId;

                    // Update parent's children
                    if (lastMessage && conversationData.chat.history.messages[lastMessage.id]) {
                        if (!conversationData.chat.history.messages[lastMessage.id].childrenIds) {
                            conversationData.chat.history.messages[lastMessage.id].childrenIds = [];
                        }
                        conversationData.chat.history.messages[lastMessage.id].childrenIds.push(userMessageId);
                    }

                    step2Result = await this.step2AddAssistantSlot(conversationId, { chat: conversationData.chat });
                }
                
                // Step 3: Stream response (same for both flows)
                const allMessages = [
                    ...conversationHistory,
                    { role: 'user', content: userMessage }
                ];
                
                if (isNewConversation) {
                    if (onProgress) onProgress(3, 4, 'Starting response stream...');
                } else {
                    if (onProgress) onProgress(2, 2, 'Starting response stream...');
                }
                
                // Enhance project context for first messages
                const enhancedProjectContext = projectContext ? {
                    ...projectContext,
                    isFirstMessage: isNewConversation && conversationHistory.length === 0
                } : null;

                await this.step3StreamResponse(
                    conversationId,
                    step2Result.assistantMessageId,
                    allMessages,
                    (chunk) => {
                        // Clear progress on first chunk
                        if (onProgress) onProgress(null);
                        onChunk(chunk);
                    },
                    onComplete,
                    onError,
                    enhancedProjectContext
                );

                // Return conversation ID for new conversations
                return { conversationId };

            } catch (error) {
                this.logger.error('StreamingAPI', 'Complete message flow failed', error);
                onError(error);
            }
        }
    }

    window.StreamingChatAPIManager = StreamingAPIManager;

})();

// ===== chat-app.js =====
(function() {
    'use strict';

    class StreamingChatApp {
        constructor() {
            this.logger = window.StreamingChatLogger;
            this.config = window.StreamingChatConfig;
            this.utils = window.StreamingChatUtils;
            
            // Version logging to identify running code
            const VERSION = 'v1.2.3-docx-fix-' + Date.now();
            console.log('🚀 DMDCGPT Chat App Version:', VERSION);
            this.logger.log('App', 'Initializing Streaming Chat App', { version: VERSION });
            
            // Initialize managers
            this.apiManager = new window.StreamingChatAPIManager();
            this.fileSystem = new window.StreamingChatFileSystem();
            this.projectManager = new window.StreamingChatProjectManager();
            this.toolManager = new window.StreamingChatToolManager(this.fileSystem);
            this.streamingParser = new window.StreamingChatParser();
            
            // UI state
            this.elements = {};
            this.currentProject = null;
            this.currentScreen = 'home'; // 'home' or 'project'
            this.currentStreamingMessage = null;
            this.lastActivityTime = Date.now();
            this.heartbeatTimer = null;
            
            // Tab management
            this.openTabs = new Map(); // tabId -> {type, projectId, filePath, content, isDirty}
            this.activeTab = 'chat';
            this.projectChats = new Map(); // projectId -> {messages: [], conversationId: null}
            this.homeMessages = []; // Messages for the general home chat
        }

        async init() {
            this.logger.log('App', 'Starting initialization');
            
            // Block non-app requests first
            window.StreamingChatFetchBlocker.enable();
            
            // Replace entire page with our UI
            this.container = window.StreamingChatUIBuilder.replacePageContent();
            this.bindElements();
            this.bindEvents();
            
            // Check authentication
            if (this.apiManager.isReady) {
                this.updateStatus('Ready - Streaming API', 'ready');
                this.updateUI();
                this.startHeartbeat();
                this.logger.log('App', 'Initialization complete');
            } else {
                this.updateStatus('Authentication required - No token found', 'error');
                this.updateUI();
                this.logger.error('App', 'Initialization failed - no auth token');
            }
        }

        bindElements() {
            this.elements = {
                // Screens
                homeScreen: document.getElementById('home-screen'),
                projectScreen: document.getElementById('project-screen'),
                
                // Home screen elements
                projectsList: document.getElementById('projects-list'),
                newProjectBtn: document.getElementById('new-project-btn'),
                homeMessages: document.getElementById('home-messages'),
                homeInput: document.getElementById('home-input'),
                homeSendBtn: document.getElementById('home-send-btn'),
                homeStatus: document.getElementById('home-status'),
                
                // Project screen elements
                backBtn: document.getElementById('back-btn'),
                currentProjectName: document.getElementById('current-project-name'),
                fileExplorer: document.getElementById('file-explorer'),
                editorTabs: document.getElementById('editor-tabs'),
                editorContent: document.getElementById('editor-content'),
                messages: document.getElementById('messages-streaming'),
                userInput: document.getElementById('user-input-streaming'),
                sendBtn: document.getElementById('send-btn-streaming'),
                status: document.getElementById('status-streaming'),
                
                // Drag and drop elements
                dragOverlay: document.getElementById('drag-overlay'),
                dragMessage: document.getElementById('drag-message')
            };
        }

        bindEvents() {
            // Home screen events
            this.elements.newProjectBtn.addEventListener('click', () => {
                this.createNewProject();
            });

            this.elements.projectsList.addEventListener('click', (e) => {
                const projectItem = e.target.closest('.project-item');
                if (projectItem) {
                    const projectId = projectItem.dataset.projectId;
                    this.openProject(projectId);
                }
            });

            // Home chat events
            this.elements.homeSendBtn.addEventListener('click', () => {
                this.sendHomeMessage();
            });

            this.elements.homeInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendHomeMessage();
                }
            });

            // Project screen events
            this.elements.backBtn.addEventListener('click', () => {
                this.goToHomeScreen();
            });

            // Project chat events
            this.elements.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });

            this.elements.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Tab switching
            this.elements.editorTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.editor-tab');
                if (tab) {
                    const tabId = tab.dataset.tab;
                    if (tabId) {
                        this.switchToTab(tabId);
                    }
                }
                
                const closeBtn = e.target.closest('.close-btn');
                if (closeBtn) {
                    e.stopPropagation();
                    const tab = closeBtn.closest('.editor-tab');
                    const tabId = tab.dataset.tab;
                    this.closeTab(tabId);
                }
            });

            // Global shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 's') {
                        e.preventDefault();
                        this.saveCurrentFile();
                    } else if (e.key === 'w') {
                        e.preventDefault();
                        if (this.activeTab !== 'chat') {
                            this.closeTab(this.activeTab);
                        }
                    }
                }
            });

            // Initialize drag and drop
            this.initializeDragAndDrop();
        }

        initializeDragAndDrop() {
            // Prevent default drag behaviors on window
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                window.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            });

            // Show drag overlay when dragging over window
            window.addEventListener('dragenter', (e) => {
                if (this.currentScreen === 'project' && this.currentProject) {
                    this.showDragOverlay();
                }
            });

            // Hide drag overlay when leaving window
            window.addEventListener('dragleave', (e) => {
                // Only hide if leaving window completely (not just moving between elements)
                if (e.clientX === 0 && e.clientY === 0) {
                    this.hideDragOverlay();
                }
            });

            // Handle drop on window
            window.addEventListener('drop', (e) => {
                this.hideDragOverlay();
                if (this.currentScreen === 'project' && this.currentProject) {
                    this.handleFileDrop(e, '/'); // Drop to root
                }
            });
        }

        showDragOverlay() {
            if (this.elements.dragOverlay) {
                this.elements.dragOverlay.classList.add('active');
            }
        }

        hideDragOverlay() {
            if (this.elements.dragOverlay) {
                this.elements.dragOverlay.classList.remove('active');
            }
        }

        updateUI() {
            if (this.currentScreen === 'home') {
                this.populateProjectsList();
                this.loadHomeMessages();
            } else {
                this.updateFileExplorer();
                this.updateEditorTabs();  
                this.updateMessages();
            }
        }

        updateProjectDropdown() {
            const dropdown = this.elements.projectDropdown;
            const projects = this.projectManager.listProjects();
            
            // Clear existing options except first two
            while (dropdown.children.length > 2) {
                dropdown.removeChild(dropdown.lastChild);
            }
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                if (project.id === this.currentProject) {
                    option.selected = true;
                }
                dropdown.appendChild(option);
            });
        }

        selectProject(projectId) {
            this.currentProject = projectId;
            this.toolManager.setActiveProjects([projectId]);
            
            // Initialize project chat if needed
            if (!this.projectChats.has(projectId)) {
                this.projectChats.set(projectId, {
                    messages: [],
                    conversationId: null
                });
            }
            
            this.updateUI();
            this.switchToTab('chat');
            this.updateStatus('Project selected - Ready to chat', 'ready');
        }

        updateFileExplorer() {
            const explorer = this.elements.fileExplorer;
            
            if (!this.currentProject) {
                explorer.innerHTML = '<div class="no-project">No files in project</div>';
                return;
            }
            
            // Create file explorer header
            const header = document.createElement('div');
            header.className = 'file-explorer-header';
            header.innerHTML = `
                <span>Files</span>
                <button id="new-file-btn" class="btn-small">+ File</button>
            `;
            
            // Create file tree container
            const treeContainer = document.createElement('div');
            treeContainer.className = 'file-tree';
            
            // Capture current expansion state before rebuilding
            const expandedFolders = this.getExpandedFolders(explorer);
            
            const files = this.fileSystem.listFiles(this.currentProject);
            const fileTree = this.buildFileTree(files);
            
            if (files.length === 0) {
                treeContainer.innerHTML = '<div class="empty-state">No files in project</div>';
            } else {
                const treeElement = this.renderFileTree(fileTree);
                treeContainer.appendChild(treeElement);
            }
            
            // Clear and rebuild explorer
            explorer.innerHTML = '';
            explorer.appendChild(header);
            explorer.appendChild(treeContainer);
            
            // Bind new file button
            const newFileBtn = explorer.querySelector('#new-file-btn');
            if (newFileBtn) {
                newFileBtn.addEventListener('click', () => {
                    this.createNewFile();
                });
            }
            
            // Add drag and drop handlers to file tree
            this.addDragAndDropToFileTree(treeContainer);
            
            // Restore expansion state
            this.restoreExpandedFolders(explorer, expandedFolders);
        }

        getExpandedFolders(container) {
            const expandedPaths = new Set();
            const folderItems = container.querySelectorAll('.folder-item.expanded');
            
            folderItems.forEach(folder => {
                // Build the folder path by traversing up the tree
                let path = '';
                let currentEl = folder;
                const pathParts = [];
                
                while (currentEl && currentEl !== container) {
                    if (currentEl.classList.contains('folder-item')) {
                        const folderName = currentEl.textContent.replace(/^[📁📂]\s*/, '');
                        pathParts.unshift(folderName);
                    }
                    currentEl = currentEl.parentElement;
                }
                
                if (pathParts.length > 0) {
                    path = pathParts.join('/');
                    expandedPaths.add(path);
                }
            });
            
            return expandedPaths;
        }

        restoreExpandedFolders(container, expandedPaths) {
            expandedPaths.forEach(path => {
                const pathParts = path.split('/');
                let currentContainer = container;
                
                // Navigate through the folder hierarchy
                for (let i = 0; i < pathParts.length; i++) {
                    const folderName = pathParts[i];
                    const folderItems = currentContainer.querySelectorAll('.folder-item');
                    
                    for (const folderEl of folderItems) {
                        const folderText = folderEl.textContent.replace(/^[📁📂]\s*/, '');
                        if (folderText === folderName) {
                            // Expand this folder
                            folderEl.classList.add('expanded');
                            
                            // Update icon
                            const folderIcon = folderEl.querySelector('.folder-icon');
                            if (folderIcon) {
                                folderIcon.textContent = '📂';
                            }
                            
                            // Show the child container
                            const childContainer = folderEl.nextElementSibling;
                            if (childContainer && childContainer.style) {
                                childContainer.style.display = 'block';
                            }
                            
                            // Move to the child container for next iteration
                            currentContainer = childContainer;
                            break;
                        }
                    }
                }
            });
        }

        buildFileTree(files) {
            const tree = {};
            
            files.forEach(filePath => {
                const parts = filePath.split('/').filter(p => p);
                let current = tree;
                
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isFile = i === parts.length - 1;
                    
                    if (!current[part]) {
                        current[part] = isFile ? { __isFile: true, path: filePath } : {};
                    }
                    current = current[part];
                }
            });
            
            return tree;
        }

        renderFileTree(tree, parentPath = '') {
            const container = document.createElement('div');
            container.className = 'file-tree';
            
            Object.keys(tree).sort().forEach(name => {
                const item = tree[name];
                
                if (item.__isFile) {
                    const fileEl = document.createElement('div');
                    fileEl.className = 'file-item';
                    fileEl.innerHTML = `📄 ${name}`;
                    fileEl.addEventListener('click', () => {
                        this.openFile(item.path);
                    });
                    container.appendChild(fileEl);
                } else {
                    const folderEl = document.createElement('div');
                    folderEl.className = 'folder-item';
                    folderEl.innerHTML = `<span class="folder-icon">📁</span>${name}`;
                    
                    const childContainer = this.renderFileTree(item, parentPath + name + '/');
                    childContainer.style.display = 'none';
                    
                    folderEl.addEventListener('click', () => {
                        const isExpanded = folderEl.classList.contains('expanded');
                        folderEl.classList.toggle('expanded');
                        childContainer.style.display = isExpanded ? 'none' : 'block';
                        
                        // Update folder icon based on expanded state
                        const folderIcon = folderEl.querySelector('.folder-icon');
                        if (folderIcon) {
                            folderIcon.textContent = isExpanded ? '📁' : '📂';
                        }
                    });
                    
                    container.appendChild(folderEl);
                    container.appendChild(childContainer);
                }
            });
            
            return container;
        }

        updateEditorTabs() {
            const tabsContainer = this.elements.editorTabs;
            
            // Always keep chat tab
            const chatTab = tabsContainer.querySelector('.chat-tab');
            if (chatTab) {
                chatTab.classList.toggle('active', this.activeTab === 'chat');
            }
            
            // Update file tabs
            const fileTabs = tabsContainer.querySelectorAll('.editor-tab:not(.chat-tab)');
            fileTabs.forEach(tab => {
                const tabId = tab.dataset.tab;
                if (!this.openTabs.has(tabId)) {
                    tab.remove();
                } else {
                    tab.classList.toggle('active', this.activeTab === tabId);
                }
            });
            
            // Add new file tabs
            this.openTabs.forEach((tabData, tabId) => {
                if (tabId === 'chat') return;
                
                let tab = tabsContainer.querySelector(`[data-tab="${tabId}"]`);
                if (!tab) {
                    tab = document.createElement('div');
                    tab.className = 'editor-tab';
                    tab.dataset.tab = tabId;
                    
                    const fileName = tabData.filePath.split('/').pop();
                    tab.innerHTML = `
                        <span>📄 ${fileName}</span>
                        <button class="close-btn">×</button>
                    `;
                    
                    tabsContainer.appendChild(tab);
                }
                
                tab.classList.toggle('active', this.activeTab === tabId);
            });
        }

        switchToTab(tabId) {
            this.activeTab = tabId;
            this.logger.log('App', 'Switching to tab', { tabId });
            
            // Update tab visual state
            this.updateEditorTabs();
            
            // Simple approach: Hide all panes, show the requested one
            const allPanes = this.elements.editorContent.querySelectorAll('.tab-pane');
            allPanes.forEach(pane => pane.classList.remove('active'));
            
            if (tabId === 'chat') {
                // Show chat pane
                const chatPane = this.elements.editorContent.querySelector('[data-tab="chat"]');
                if (chatPane) {
                    chatPane.classList.add('active');
                    this.logger.log('App', 'Chat pane shown');
                }
            } else {
                // Show file editor with content for this tab
                this.showFileEditor(tabId);
            }
        }

        updateFileEditorContent(tabId, filePane) {
            const tabData = this.openTabs.get(tabId);
            if (!tabData) {
                this.logger.error('App', 'No tab data found for file editor update', { tabId });
                return;
            }
            
            // Update file path display
            const filePathElement = filePane.querySelector('.file-path');
            if (filePathElement) {
                filePathElement.textContent = tabData.filePath;
            }
            
            // Update editor content
            if (tabData.editor) {
                tabData.editor.setValue(tabData.content);
                this.logger.log('App', 'Updated file editor content', { filePath: tabData.filePath });
            } else {
                this.logger.warn('App', 'No editor instance found for tab', { tabId });
                // Reinitialize the editor if needed
                this.initializeFileEditor(tabId, filePane);
            }
        }

        initializeFileEditor(tabId, filePane) {
            const tabData = this.openTabs.get(tabId);
            if (!tabData) {
                this.logger.error('App', 'No tab data found for editor initialization', { tabId });
                return;
            }
            
            const editorContainer = filePane.querySelector('.file-editor-content');
            if (!editorContainer) {
                this.logger.error('App', 'No editor container found in file pane');
                return;
            }
            
            this.logger.log('App', 'Initializing CodeEditor for file', { 
                tabId,
                filePath: tabData.filePath, 
                contentLength: tabData.content.length 
            });
            
            let editor;
            try {
                editor = new window.CodeEditor(editorContainer);
                this.logger.log('App', 'CodeEditor created successfully');
                
                // Register Java plugin if available
                if (window.JavaPlugin) {
                    const javaPlugin = new window.JavaPlugin();
                    editor.registerPlugin('java', javaPlugin);
                    this.logger.log('App', 'Java plugin registered');
                    
                    // Auto-detect language based on file extension
                    const fileExt = tabData.filePath.toLowerCase().split('.').pop();
                    if (fileExt === 'java') {
                        this.logger.log('App', 'Setting language to Java for file', { fileExt });
                        try {
                            editor.setLanguage('java');
                            this.logger.log('App', 'Java language set successfully');
                        } catch (langError) {
                            this.logger.error('App', 'Failed to set Java language', langError);
                        }
                    }
                } else {
                    this.logger.warn('App', 'JavaPlugin not available');
                }
                
                // Set initial content
                this.logger.log('App', 'Setting editor content', { 
                    contentPreview: tabData.content.substring(0, 100) + (tabData.content.length > 100 ? '...' : '') 
                });
                editor.setValue(tabData.content);
                this.logger.log('App', 'Editor content set successfully');
                
            } catch (editorError) {
                this.logger.error('App', 'Failed to initialize CodeEditor', editorError);
                
                // Fallback to textarea
                this.logger.log('App', 'Using textarea fallback');
                editorContainer.innerHTML = `
                    <textarea 
                        style="width: 100%; height: 100%; border: none; font-family: monospace; font-size: 14px; padding: 8px; background: #1a1a1a; color: #e0e0e0;"
                        placeholder="Editor failed to load, using simple text area..."
                    >${tabData.content}</textarea>
                `;
                
                const textarea = editorContainer.querySelector('textarea');
                editor = {
                    getValue: () => textarea.value,
                    setValue: (value) => { textarea.value = value; },
                    onContentChange: null
                };
                
                textarea.addEventListener('input', () => {
                    tabData.content = textarea.value;
                    tabData.isDirty = true;
                    this.updateTabTitle(tabId);
                    if (editor.onContentChange) {
                        editor.onContentChange();
                    }
                });
            }
            
            // Store editor reference and set up change handler
            tabData.editor = editor;
            editor.onContentChange = () => {
                tabData.content = editor.getValue();
                tabData.isDirty = true;
                this.updateTabTitle(tabId);
            };
            
            // Handle save button
            const saveBtn = filePane.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveFile(tabId);
                });
            }
        }

        openFile(filePath) {
            if (!this.currentProject) return;
            
            const tabId = `${this.currentProject}:${filePath}`;
            
            // Check if already open
            if (this.openTabs.has(tabId)) {
                this.switchToTab(tabId);
                return;
            }
            
            // Load file content
            const content = this.fileSystem.readFile(this.currentProject, filePath) || '';
            
            // Add to open tabs
            this.openTabs.set(tabId, {
                type: 'file',
                projectId: this.currentProject,
                filePath: filePath,
                content: content,
                isDirty: false
            });
            
            // Update UI and switch to tab
            this.updateEditorTabs();
            this.switchToTab(tabId);
        }

        showFileEditor(tabId) {
            const tabData = this.openTabs.get(tabId);
            if (!tabData) {
                this.logger.error('App', 'No tab data found for showFileEditor', { tabId });
                return;
            }
            
            this.logger.log('App', 'Showing file editor for tab', { tabId, filePath: tabData.filePath });
            
            // Remove any existing file editor pane to ensure clean state
            const existingPane = this.elements.editorContent.querySelector('.file-editor-pane');
            if (existingPane) {
                this.logger.log('App', 'Removing existing file editor pane');
                existingPane.remove();
            }
            
            // Create new file editor pane
            const pane = document.createElement('div');
            pane.className = 'tab-pane file-editor-pane active';
            pane.innerHTML = `
                <div class="file-actions">
                    <span class="file-path">${tabData.filePath}</span>
                    <button class="btn save-btn">Save</button>
                </div>
                <div class="file-editor-content" style="height: calc(100% - 40px);">
                </div>
            `;
            
            this.elements.editorContent.appendChild(pane);
            this.logger.log('App', 'File editor pane created and added to DOM');
            
            // Initialize the editor
            this.initializeFileEditor(tabId, pane);
        }

        saveFile(tabId) {
            const tabData = this.openTabs.get(tabId);
            if (!tabData || tabData.type !== 'file') return;
            
            // Get current content from editor
            if (tabData.editor) {
                tabData.content = tabData.editor.getValue();
            }
            
            // Save to file system
            const success = this.fileSystem.writeFile(tabData.projectId, tabData.filePath, tabData.content);
            
            if (success) {
                tabData.isDirty = false;
                this.updateTabTitle(tabId);
                this.logger.log('App', 'File saved', { 
                    projectId: tabData.projectId, 
                    filePath: tabData.filePath 
                });
                
                // Show brief success indicator
                const saveBtn = document.querySelector('.file-editor-pane .save-btn');
                if (saveBtn) {
                    const originalText = saveBtn.textContent;
                    saveBtn.textContent = 'Saved!';
                    saveBtn.style.background = '#28a745';
                    setTimeout(() => {
                        saveBtn.textContent = originalText;
                        saveBtn.style.background = '';
                    }, 1000);
                }
            } else {
                alert('Failed to save file');
            }
        }

        updateTabTitle(tabId) {
            const tabData = this.openTabs.get(tabId);
            if (!tabData) return;
            
            const tabElement = document.querySelector(`[data-tab="${tabId}"]`);
            if (tabElement) {
                const fileName = tabData.filePath.split('/').pop();
                const dirtyIndicator = tabData.isDirty ? '*' : '';
                tabElement.textContent = `${fileName}${dirtyIndicator}`;
            }
        }

        closeTab(tabId) {
            if (tabId === 'chat') return; // Can't close chat tab
            
            const tabData = this.openTabs.get(tabId);
            if (tabData && tabData.isDirty) {
                if (!confirm('File has unsaved changes. Close anyway?')) {
                    return;
                }
            }
            
            this.openTabs.delete(tabId);
            
            // If closing active tab, switch to chat
            if (this.activeTab === tabId) {
                this.switchToTab('chat');
            } else {
                this.updateEditorTabs();
            }
        }


        saveCurrentFile() {
            if (this.activeTab !== 'chat') {
                this.saveFile(this.activeTab);
            }
        }

        createNewProject() {
            const name = prompt('Project name:');
            if (name && name.trim()) {
                const project = this.projectManager.createProject(name.trim());
                this.openProject(project.id);
            }
        }

        createNewFile() {
            if (!this.currentProject) {
                alert('Please select a project first');
                return;
            }
            
            const path = prompt('File path (e.g., /src/main.js):');
            if (path && path.trim()) {
                const filePath = path.trim();
                this.fileSystem.writeFile(this.currentProject, filePath, '');
                this.updateFileExplorer();
                this.openFile(filePath);
            }
        }

        updateMessages() {
            if (!this.currentProject) return;
            
            const projectChat = this.projectChats.get(this.currentProject);
            if (!projectChat) return;
            
            this.elements.messages.innerHTML = '';
            
            projectChat.messages.forEach(msg => {
                const messageEl = document.createElement('div');
                messageEl.className = `message ${msg.role}`;
                messageEl.textContent = msg.content;
                this.elements.messages.appendChild(messageEl);
            });
            
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        }

        updateStatus(message, type = 'ready') {
            this.elements.status.textContent = message;
            this.elements.status.className = `status-bar ${type}`;
        }

        createStreamingMessage() {
            const messageEl = document.createElement('div');
            messageEl.className = 'message assistant streaming';
            this.elements.messages.appendChild(messageEl);
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            return messageEl;
        }

        createProgressMessage(message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message assistant loading';
            messageEl.innerHTML = `
                <div class="loading-animation">
                    <span class="loading-star">✻</span>
                    <span class="loading-text">Thinking...</span>
                </div>
            `;
            this.elements.messages.appendChild(messageEl);
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            
            // Start the loading animation
            this.startLoadingAnimation(messageEl);
            
            return messageEl;
        }

        startLoadingAnimation(messageEl) {
            const starElement = messageEl.querySelector('.loading-star');
            const textElement = messageEl.querySelector('.loading-text');
            
            if (!starElement || !textElement) return;
            
            // Star characters to cycle through
            const stars = ['✻', '✧', '✦', '✶', '✴', '✵', '⋆', '★', '*', '✱'];
            
            // Fun loading verbs
            const verbs = [
                'Thinking...', 'Creating...', 'Coding...', 'Processing...', 
                'Analyzing...', 'Computing...', 'Generating...', 'Building...',
                'Crafting...', 'Designing...', 'Solving...', 'Working...',
                'Magic-ing...', 'Brewing...', 'Conjuring...', 'Killing it...'
            ];
            
            let starIndex = 0;
            let textIndex = 0;
            let animationFrame = 0;
            
            const animate = () => {
                if (!messageEl.parentNode || !messageEl.classList.contains('loading')) {
                    return; // Stop animation if element is removed or no longer loading
                }
                
                // Update star (faster cycle)
                if (animationFrame % 8 === 0) {
                    starIndex = (starIndex + 1) % stars.length;
                    starElement.textContent = stars[starIndex];
                }
                
                // Update text (slower cycle)  
                if (animationFrame % 60 === 0) {
                    textIndex = (textIndex + 1) % verbs.length;
                    textElement.textContent = verbs[textIndex];
                }
                
                animationFrame++;
                setTimeout(animate, 100); // 10 FPS
            };
            
            animate();
        }

        updateProgressMessage(message, current, total) {
            // Legacy method - now just updates the loading text if needed
            if (this.currentStreamingMessage && this.currentStreamingMessage.classList.contains('loading')) {
                const textElement = this.currentStreamingMessage.querySelector('.loading-text');
                if (textElement && message) {
                    textElement.textContent = message;
                }
            }
        }

        createToolUseIndicator(toolData) {
            const indicator = document.createElement('span');
            indicator.className = 'tool-use-indicator';
            indicator.innerHTML = `
                <span class="tool-icon">🔧</span>
                <span class="tool-main">${toolData.tool_type}</span>
            `;
            
            indicator.addEventListener('click', () => {
                alert(`Tool: ${toolData.tool_type}\n\nParameters:\n${JSON.stringify(toolData, null, 2)}`);
            });
            
            return indicator;
        }

        createToolResultBubble(result) {
            const bubble = document.createElement('div');
            bubble.className = 'message tool-result';
            
            const header = document.createElement('div');
            header.className = 'tool-header';
            header.innerHTML = `
                <span class="tool-icon">⚙️</span>
                <span class="tool-title">Tool Result: ${result.tool_type}</span>
            `;
            
            const preview = document.createElement('div');
            preview.className = 'tool-preview';
            
            if (result.error) {
                preview.textContent = `Error: ${result.error}`;
            } else if (result.results && result.results.length > 0) {
                preview.textContent = `Found ${result.results.length} result(s)`;
            } else {
                preview.textContent = 'No results';
            }
            
            bubble.appendChild(header);
            bubble.appendChild(preview);
            
            bubble.addEventListener('click', () => {
                alert(`Tool Result:\n\n${JSON.stringify(result, null, 2)}`);
            });
            
            return bubble;
        }

        createToolUseBubble(toolData) {
            const bubble = document.createElement('div');
            bubble.className = 'message tool-use';
            bubble.dataset.toolType = toolData.tool_type;
            
            const header = document.createElement('div');
            header.className = 'tool-header';
            header.innerHTML = `
                <span class="tool-icon">🔧</span>
                <span class="tool-title">Using Tool: ${toolData.tool_type}</span>
                <span class="tool-status">Processing...</span>
            `;
            
            const requestSection = document.createElement('div');
            requestSection.className = 'tool-request';
            requestSection.innerHTML = `
                <div class="tool-request-label">Request:</div>
                <div class="tool-request-content">${JSON.stringify(toolData, null, 2)}</div>
            `;
            
            const resultSection = document.createElement('div');
            resultSection.className = 'tool-result-section';
            resultSection.style.display = 'none'; // Hidden until we have results
            
            bubble.appendChild(header);
            bubble.appendChild(requestSection);
            bubble.appendChild(resultSection);
            
            return bubble;
        }

        updateToolUseBubble(bubble, result) {
            const header = bubble.querySelector('.tool-header .tool-status');
            const resultSection = bubble.querySelector('.tool-result-section');
            
            if (result.error) {
                header.textContent = 'Failed';
                header.className = 'tool-status error';
                resultSection.innerHTML = `
                    <div class="tool-result-label">Error:</div>
                    <div class="tool-result-content error">${result.error}</div>
                `;
            } else {
                header.textContent = 'Completed';
                header.className = 'tool-status success';
                
                const summary = result.results 
                    ? `${result.results.length} result(s)`
                    : 'No results';
                    
                resultSection.innerHTML = `
                    <div class="tool-result-label">Result: ${summary}</div>
                    <div class="tool-result-content">${JSON.stringify(result, null, 2)}</div>
                `;
            }
            
            resultSection.style.display = 'block';
        }

        async sendMessage(isHeartbeat = false) {
            if (!this.currentProject) {
                if (!isHeartbeat) {
                    this.updateStatus('Please select a project first', 'error');
                }
                return;
            }

            const input = this.elements.userInput;
            const userMessage = isHeartbeat ? this.config.HEARTBEAT_MESSAGE : input.value.trim();

            if (!userMessage) {
                if (!isHeartbeat) {
                    this.updateStatus('Please enter a message', 'error');
                }
                return;
            }

            if (!isHeartbeat) {
                this.elements.sendBtn.disabled = true;
                input.disabled = true;
                input.value = '';
            }

            const projectChat = this.projectChats.get(this.currentProject);
            const existingConversationId = projectChat ? projectChat.conversationId : null;

            try {
                this.updateActivity();

                if (!isHeartbeat) {
                    // Add user message to chat
                    const userMessageEl = document.createElement('div');
                    userMessageEl.className = 'message user';
                    userMessageEl.textContent = userMessage;
                    this.elements.messages.appendChild(userMessageEl);
                    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

                    // Add to project chat history
                    if (projectChat) {
                        projectChat.messages.push({
                            role: 'user',
                            content: userMessage,
                            timestamp: Date.now()
                        });
                    }

                    // Create progress message
                    this.currentStreamingMessage = this.createProgressMessage('Starting...');
                    this.streamingParser.reset();
                }

                const result = await this.apiManager.sendMessage(
                    userMessage,
                    projectChat ? projectChat.messages.slice(0, -1) : [], // All previous messages except the just-added user message
                    existingConversationId,
                    // onChunk
                    (chunk) => {
                        if (!isHeartbeat) {
                            const parseResult = this.streamingParser.processChunk(chunk);
                            
                            // Handle different response types
                            if (parseResult.responseType === 'tool_use') {
                                // Tool use response - convert streaming message to tool use bubble(s)
                                if (this.currentStreamingMessage && this.currentStreamingMessage.classList.contains('streaming')) {
                                    // Replace progress message with tool use bubble
                                    this.currentStreamingMessage.remove();
                                    this.currentStreamingMessage = null;
                                }
                                
                                // Create/update tool use bubbles
                                parseResult.toolUses.forEach(toolUse => {
                                    // Check if bubble already exists for this tool use
                                    const existingBubble = Array.from(this.elements.messages.children)
                                        .find(el => el.classList.contains('tool-use') && 
                                                  el.dataset.toolData === JSON.stringify(toolUse.data));
                                    
                                    if (!existingBubble) {
                                        const toolBubble = this.createToolUseBubble(toolUse.data);
                                        toolBubble.dataset.toolData = JSON.stringify(toolUse.data);
                                        this.elements.messages.appendChild(toolBubble);
                                        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                                    }
                                });
                                
                                this.updateStatus('Processing tools...', 'streaming');
                            } else if (parseResult.responseType === 'message') {
                                // Regular message response - stream text normally
                                if (this.currentStreamingMessage) {
                                    this.currentStreamingMessage.textContent += parseResult.displayText;
                                }
                                
                                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                                this.updateStatus('Streaming response...', 'streaming');
                            }
                            
                            // Legacy tool use indicators (shouldn't happen with new flow)
                            parseResult.toolUses.forEach(toolUse => {
                                const indicator = this.createToolUseIndicator(toolUse.data);
                                if (this.currentStreamingMessage) {
                                    this.currentStreamingMessage.appendChild(indicator);
                                }
                            });
                        }
                    },
                    // onComplete
                    async () => {
                        if (isHeartbeat) {
                            this.logger.log('Heartbeat', 'Heartbeat completed successfully');
                        } else {
                            this.logger.log('App', 'Streaming completed');
                            
                            // Remove streaming indicator
                            if (this.currentStreamingMessage) {
                                this.currentStreamingMessage.classList.remove('streaming');
                            }
                            
                            // Get all tool uses from the complete response
                            const toolUses = this.streamingParser.getToolUses();
                            
                            if (toolUses.length > 0) {
                                this.logger.log('App', 'Executing tools', { count: toolUses.length });
                                this.updateStatus('Executing tools...', 'streaming');
                                
                                // Execute all tools and update their bubbles
                                const toolResults = [];
                                for (const toolUse of toolUses) {
                                    // Find the corresponding tool use bubble
                                    const toolBubble = Array.from(this.elements.messages.children)
                                        .find(el => el.classList.contains('tool-use') && 
                                                  el.dataset.toolData === JSON.stringify(toolUse.data));
                                    
                                    try {
                                        const result = await this.toolManager.executeTool(toolUse.data);
                                        toolResults.push(result);
                                        
                                        // Update the existing tool use bubble with results
                                        if (toolBubble) {
                                            this.updateToolUseBubble(toolBubble, result);
                                        } else {
                                            // Fallback: create separate result bubble if no tool bubble found
                                            const resultBubble = this.createToolResultBubble(result);
                                            this.elements.messages.appendChild(resultBubble);
                                        }
                                        
                                        // Refresh file explorer if file operations were successful
                                        if (toolUse.data.tool_type === 'write_file' && result.results.some(r => r.status === 'success')) {
                                            this.updateFileExplorer();
                                        }
                                        
                                        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                                    } catch (error) {
                                        this.logger.error('App', 'Tool execution failed', error);
                                        
                                        const errorResult = {
                                            tool_type: toolUse.data.tool_type,
                                            error: error.message,
                                            results: []
                                        };
                                        
                                        // Update the existing tool use bubble with error
                                        if (toolBubble) {
                                            this.updateToolUseBubble(toolBubble, errorResult);
                                        } else {
                                            // Fallback: create separate error bubble
                                            const errorBubble = this.createToolResultBubble(errorResult);
                                            this.elements.messages.appendChild(errorBubble);
                                        }
                                    }
                                }
                                
                                this.updateStatus('Tools completed', 'success');
                                
                                // TODO: If tools were executed, continue conversation with tool results
                                // For now, just complete this turn
                            }
                            
                            // Save the complete response only if it's a message response
                            const responseType = this.streamingParser.getResponseType();
                            const completeOutput = this.streamingParser.getCompleteOutput();
                            
                            if (responseType === 'message' && completeOutput && completeOutput.trim() && projectChat) {
                                projectChat.messages.push({
                                    role: 'assistant',
                                    content: completeOutput.trim(),
                                    timestamp: Date.now()
                                });
                                this.logger.log('App', 'Assistant message response saved to project chat', {
                                    projectId: this.currentProject,
                                    responseLength: completeOutput.trim().length,
                                    totalMessages: projectChat.messages.length
                                });
                            } else if (responseType === 'tool_use') {
                                this.logger.log('App', 'Tool use response - not saving to chat history', {
                                    toolCount: this.streamingParser.getToolUses().length
                                });
                            } else {
                                this.logger.warn('App', 'Empty or invalid response - not saving', {
                                    responseType,
                                    completeOutput,
                                    hasProjectChat: !!projectChat
                                });
                            }
                            
                            this.currentStreamingMessage = null;
                            this.updateStatus('Message completed', 'success');
                        }
                    },
                    // onError
                    (error) => {
                        if (!isHeartbeat) {
                            this.logger.error('App', 'Streaming failed', error);
                            
                            // Remove streaming message on error
                            if (this.currentStreamingMessage) {
                                this.currentStreamingMessage.remove();
                                this.currentStreamingMessage = null;
                            }
                            
                            if (error.message.includes('Authentication') || error.message.includes('token')) {
                                this.updateStatus('Authentication error - Please refresh and log in', 'error');
                            } else {
                                this.updateStatus(`Error: ${error.message}`, 'error');
                            }
                        } else {
                            this.logger.error('Heartbeat', 'Heartbeat failed', error);
                        }
                    },
                    // onProgress
                    !isHeartbeat ? (current, total, message) => {
                        if (current === null) {
                            // Replace loading message with streaming message
                            if (this.currentStreamingMessage && this.currentStreamingMessage.classList.contains('loading')) {
                                this.currentStreamingMessage.remove();
                                this.currentStreamingMessage = this.createStreamingMessage();
                            }
                            this.updateStatus('Streaming response...', 'streaming');
                        } else {
                            // Update progress bar and text
                            this.updateProgressMessage(message, current, total);
                            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                        }
                    } : null,
                    // projectContext - include file structure for first message
                    this.currentProject ? {
                        projectId: this.currentProject,
                        files: this.fileSystem.listFiles(this.currentProject)
                    } : null
                );
                
                // Save conversation ID for new conversations (after await completes)
                if (!isHeartbeat && result && result.conversationId && !existingConversationId && projectChat) {
                    projectChat.conversationId = result.conversationId;
                    this.logger.log('App', 'Saved new conversation ID for project', { 
                        conversationId: result.conversationId,
                        projectId: this.currentProject
                    });
                }
                
            } catch (error) {
                if (!isHeartbeat) {
                    this.logger.error('App', 'Send message failed', error);
                    this.updateStatus(`Error: ${error.message}`, 'error');
                }
            } finally {
                if (!isHeartbeat) {
                    this.elements.sendBtn.disabled = false;
                    input.disabled = false;
                    this.elements.userInput.focus();
                }
            }
        }

        updateActivity() {
            this.lastActivityTime = Date.now();
        }

        startHeartbeat() {
            this.logger.log('Heartbeat', 'Starting heartbeat system');
            
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
            }
            
            this.heartbeatTimer = setInterval(() => {
                const timeSinceActivity = Date.now() - this.lastActivityTime;
                
                if (timeSinceActivity >= this.config.HEARTBEAT_INTERVAL) {
                    this.logger.log('Heartbeat', 'Sending heartbeat to keep session alive');
                    this.sendMessage(true);
                    this.updateActivity();
                }
            }, 10000);
        }

        stopHeartbeat() {
            if (this.heartbeatTimer) {
                clearInterval(this.heartbeatTimer);
                this.heartbeatTimer = null;
            }
        }

        // Screen Navigation Methods
        goToHomeScreen() {
            this.logger.log('App', 'Navigating to home screen');
            this.currentScreen = 'home';
            this.currentProject = null;
            this.elements.homeScreen.classList.add('active');
            this.elements.projectScreen.classList.remove('active');
            this.populateProjectsList();
            this.loadHomeMessages();
        }

        openProject(projectId) {
            this.logger.log('App', 'Opening project', { projectId });
            const project = this.projectManager.getProject(projectId);
            if (!project) {
                this.logger.error('App', 'Project not found', { projectId });
                return;
            }
            
            this.currentProject = projectId;
            this.currentScreen = 'project';
            this.elements.homeScreen.classList.remove('active');
            this.elements.projectScreen.classList.add('active');
            
            // Update project name in header
            this.elements.currentProjectName.textContent = project.name;
            
            // Load project-specific data
            this.loadProjectMessages();
            this.updateFileExplorer();
            this.updateEditorTabs();
        }

        populateProjectsList() {
            if (!this.projectManager || typeof this.projectManager.getAllProjects !== 'function') {
                this.logger.error('App', 'Project manager not available or getAllProjects method missing');
                return;
            }
            
            const projects = this.projectManager.getAllProjects();
            const projectsList = this.elements.projectsList;
            
            if (!projectsList) {
                this.logger.error('App', 'Projects list element not found');
                return;
            }
            
            projectsList.innerHTML = '';
            
            if (!projects || projects.length === 0) {
                projectsList.innerHTML = '<div class="no-projects">No projects yet. Create your first project!</div>';
                return;
            }
            
            projects.forEach(project => {
                const projectItem = document.createElement('div');
                projectItem.className = 'project-item';
                projectItem.dataset.projectId = project.id;
                projectItem.innerHTML = `
                    <div class="project-item-name">${project.name}</div>
                    <div class="project-item-path">${new Date(project.created).toLocaleDateString()}</div>
                `;
                projectsList.appendChild(projectItem);
            });
        }

        // Home Chat Methods
        sendHomeMessage() {
            const input = this.elements.homeInput.value.trim();
            if (!input) return;
            
            this.logger.log('App', 'Sending home message', { input });
            
            // Clear input
            this.elements.homeInput.value = '';
            
            // Add user message
            this.addHomeMessage('user', input);
            
            // Process message (no project context)
            this.processHomeMessage(input);
        }

        addHomeMessage(sender, content, isStreaming = false, isLoading = false) {
            const messageEl = document.createElement('div');
            messageEl.className = `message ${sender}`;
            
            if (isStreaming) {
                messageEl.classList.add('streaming');
            }
            
            if (isLoading) {
                messageEl.classList.add('loading');
                messageEl.innerHTML = `
                    <div class="loading-animation">
                        <span class="loading-star">✻</span>
                        <span class="loading-text">Thinking...</span>
                    </div>
                `;
                this.startLoadingAnimation(messageEl);
            } else {
                messageEl.textContent = content;
            }
            
            this.elements.homeMessages.appendChild(messageEl);
            this.elements.homeMessages.scrollTop = this.elements.homeMessages.scrollHeight;
            
            // Store in home messages
            if (!isLoading) {
                this.homeMessages.push({ sender, content, timestamp: Date.now() });
            }
            
            return messageEl;
        }

        async processHomeMessage(message) {
            // Update status
            this.elements.homeStatus.textContent = 'Thinking...';
            this.elements.homeStatus.className = 'status-bar streaming';
            
            // Add loading message
            const loadingEl = this.addHomeMessage('assistant', '', false, true);
            
            try {
                let responseContent = '';
                let responseMessageEl = null;
                
                // Convert home messages to API format
                const conversationHistory = (this.homeMessages || []).map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }));
                
                // Process without project context (no tools available)
                await this.apiManager.sendMessage(
                    message, 
                    conversationHistory, // Use converted home message history
                    null, // No existing conversation ID for home chat
                    (chunk) => {
                        // On chunk received
                        if (!responseMessageEl) {
                            // Remove loading message and create response message on first chunk
                            loadingEl.remove();
                            responseMessageEl = this.addHomeMessage('assistant', '', true);
                        }
                        responseContent += chunk;
                        responseMessageEl.textContent = responseContent;
                        this.elements.homeMessages.scrollTop = this.elements.homeMessages.scrollHeight;
                    },
                    () => {
                        // On complete
                        if (responseMessageEl) {
                            responseMessageEl.classList.remove('streaming');
                            // Add to home messages history
                            this.homeMessages.push({ 
                                sender: 'assistant', 
                                content: responseContent, 
                                timestamp: Date.now() 
                            });
                        }
                        this.elements.homeStatus.textContent = 'Ready';
                        this.elements.homeStatus.className = 'status-bar ready';
                    },
                    (error) => {
                        // On error
                        this.logger.error('App', 'Error processing home message', error);
                        if (loadingEl && loadingEl.parentNode) {
                            loadingEl.remove();
                        }
                        if (responseMessageEl && responseMessageEl.parentNode) {
                            responseMessageEl.remove();
                        }
                        this.addHomeMessage('assistant', 'Sorry, I encountered an error processing your message.');
                        this.elements.homeStatus.textContent = 'Error';
                        this.elements.homeStatus.className = 'status-bar error';
                    }
                );
                
            } catch (error) {
                this.logger.error('App', 'Error setting up home message processing', error);
                if (loadingEl && loadingEl.parentNode) {
                    loadingEl.remove();
                }
                this.addHomeMessage('assistant', 'Sorry, I encountered an error processing your message.');
                this.elements.homeStatus.textContent = 'Error';
                this.elements.homeStatus.className = 'status-bar error';
            }
        }

        loadHomeMessages() {
            this.elements.homeMessages.innerHTML = '';
            this.homeMessages.forEach(msg => {
                this.addHomeMessage(msg.sender, msg.content);
            });
        }

        loadProjectMessages() {
            // Load project-specific chat messages
            if (!this.currentProject) return;
            
            const projectChat = this.projectChats.get(this.currentProject);
            if (projectChat && projectChat.messages) {
                this.elements.messages.innerHTML = '';
                projectChat.messages.forEach(msg => {
                    this.addMessage(msg.sender, msg.content);
                });
            } else {
                this.elements.messages.innerHTML = '';
            }
        }

        // Drag and Drop Methods
        addDragAndDropToFileTree(treeContainer) {
            // Add drag and drop handlers to the tree container
            treeContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.handleTreeDragOver(e, treeContainer);
            });

            treeContainer.addEventListener('dragleave', (e) => {
                this.handleTreeDragLeave(e, treeContainer);
            });

            treeContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                this.handleTreeDrop(e, treeContainer);
            });

            // Add handlers to individual file and folder items
            const items = treeContainer.querySelectorAll('.file-item, .folder-item');
            items.forEach(item => {
                item.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleItemDragOver(e, item);
                });

                item.addEventListener('dragleave', (e) => {
                    e.stopPropagation();
                    this.handleItemDragLeave(e, item);
                });

                item.addEventListener('drop', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleItemDrop(e, item);
                });
            });
        }

        handleTreeDragOver(e, treeContainer) {
            // Check if we're near the edges (10px padding) or over empty space
            const rect = treeContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const nearEdge = x < 10 || y < 10 || x > rect.width - 10 || y > rect.height - 10;
            const overEmptySpace = e.target === treeContainer || e.target.classList.contains('empty-state');
            
            if (nearEdge || overEmptySpace) {
                treeContainer.classList.add('drag-over-root');
            }
        }

        handleTreeDragLeave(e, treeContainer) {
            // Only remove highlight if actually leaving the tree container
            if (!treeContainer.contains(e.relatedTarget)) {
                treeContainer.classList.remove('drag-over-root');
            }
        }

        handleTreeDrop(e, treeContainer) {
            treeContainer.classList.remove('drag-over-root');
            this.hideDragOverlay();
            this.handleFileDrop(e, '/'); // Drop to project root
        }

        handleItemDragOver(e, item) {
            if (item.classList.contains('folder-item')) {
                item.classList.add('drag-over-folder');
            } else if (item.classList.contains('file-item')) {
                item.classList.add('drag-over-invalid');
            }
        }

        handleItemDragLeave(e, item) {
            item.classList.remove('drag-over-folder', 'drag-over-invalid');
        }

        handleItemDrop(e, item) {
            item.classList.remove('drag-over-folder', 'drag-over-invalid');
            this.hideDragOverlay();
            
            if (item.classList.contains('folder-item')) {
                const folderPath = this.getItemPath(item);
                this.handleFileDrop(e, folderPath);
            }
            // Files are invalid drop targets, so we don't handle drops on them
        }

        getItemPath(item) {
            // Build the path by traversing up the tree structure
            const pathParts = [];
            let currentEl = item;
            
            while (currentEl && !currentEl.classList.contains('file-tree')) {
                if (currentEl.classList.contains('folder-item')) {
                    const folderName = currentEl.textContent.replace(/^[📁📂]\s*/, '').trim();
                    if (folderName) {
                        pathParts.unshift(folderName);
                    }
                }
                currentEl = currentEl.parentElement;
            }
            
            return '/' + pathParts.join('/');
        }

        async handleFileDrop(e, targetPath) {
            const files = Array.from(e.dataTransfer.files);
            
            if (files.length === 0) {
                this.logger.warn('DragDrop', 'No files in drop event');
                return;
            }

            this.logger.log('DragDrop', 'Processing file drop', { 
                fileCount: files.length, 
                targetPath,
                projectId: this.currentProject 
            });

            let processedCount = 0;
            
            for (const file of files) {
                try {
                    await this.processDroppedFile(file, targetPath);
                    processedCount++;
                } catch (error) {
                    this.logger.error('DragDrop', 'Failed to process file', { 
                        fileName: file.name, 
                        error 
                    });
                }
            }

            // Update file explorer to show new files
            this.updateFileExplorer();
            
            // Show success message
            this.updateStatus(`Processed ${processedCount} file(s) - DOCX files converted to JSON`, 'success');
            setTimeout(() => {
                this.updateStatus('Ready', 'ready');
            }, 2000);
        }

        async processDroppedFile(file, targetPath) {
            // Check if this is a DOCX file
            const isDocxFile = file.name.toLowerCase().endsWith('.docx') || 
                             file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            
            if (isDocxFile) {
                return this.processDocxFile(file, targetPath);
            } else {
                return this.processRegularFile(file, targetPath);
            }
        }
        
        async processDocxFile(file, targetPath) {
            return new Promise(async (resolve, reject) => {
                try {
                    this.logger.log('DragDrop', 'Processing DOCX file', { fileName: file.name });
                    this.updateStatus('Converting DOCX to JSON...', 'processing');
                    
                    // Read file as base64
                    const reader = new FileReader();
                    
                    reader.onload = async (e) => {
                        try {
                            // Extract base64 content (remove data:...;base64, prefix)
                            const base64Content = e.target.result.split(',')[1];
                            
                            this.logger.log('DragDrop', 'DOCX file read as base64', { 
                                fileName: file.name,
                                base64Length: base64Content.length 
                            });
                            
                            // Send to backend for conversion
                            const response = await window.ServerCommunicator.convertDocxToJson(base64Content);
                            
                            this.logger.log('DragDrop', 'Backend response received', { 
                                fileName: file.name,
                                responseLength: response.length,
                                responsePreview: response.substring(0, 200) + (response.length > 200 ? '...' : '')
                            });
                            
                            console.log('🔍 Full backend response:', response);
                            
                            // Check if response is an error
                            let parsedResponse;
                            try {
                                parsedResponse = JSON.parse(response);
                                if (parsedResponse.error) {
                                    throw new Error(parsedResponse.message || 'DOCX conversion failed');
                                }
                            } catch (parseError) {
                                // If it's not JSON, assume it's successful raw JSON content
                                if (parseError.message.includes('DOCX conversion failed') || 
                                    parseError.message.includes('conversion failed')) {
                                    throw parseError;
                                }
                                // Otherwise, treat as successful JSON response
                                parsedResponse = null;
                            }
                            
                            // Use the raw response as JSON content if parsing failed (successful conversion)
                            const jsonResult = parsedResponse ? JSON.stringify(parsedResponse, null, 2) : response;
                            
                            this.logger.log('DragDrop', 'DOCX converted to JSON successfully', { 
                                fileName: file.name,
                                jsonLength: jsonResult.length 
                            });
                            
                            // Construct file path with .json extension
                            const baseName = file.name.replace(/\.docx$/i, '');
                            const jsonFileName = `${baseName}.json`;
                            const fullPath = targetPath === '/' ? `/${jsonFileName}` : `${targetPath}/${jsonFileName}`;
                            
                            // Store the JSON result in the file system
                            const success = this.fileSystem.writeFile(this.currentProject, fullPath, jsonResult);
                            
                            if (success) {
                                this.logger.log('DragDrop', 'DOCX JSON stored successfully', { 
                                    originalFile: file.name,
                                    jsonFile: jsonFileName,
                                    fullPath,
                                    size: jsonResult.length 
                                });
                                this.updateStatus('DOCX converted and stored as JSON', 'success');
                                resolve();
                            } else {
                                reject(new Error('Failed to write JSON file to storage'));
                            }
                        } catch (error) {
                            this.logger.error('DragDrop', 'DOCX conversion failed', { 
                                fileName: file.name, 
                                error: error.message 
                            });
                            this.updateStatus('DOCX conversion failed', 'error');
                            reject(error);
                        }
                    };
                    
                    reader.onerror = () => {
                        reject(new Error('Failed to read DOCX file'));
                    };
                    
                    // Read file as data URL to get base64
                    reader.readAsDataURL(file);
                    
                } catch (error) {
                    this.logger.error('DragDrop', 'DOCX processing error', error);
                    reject(error);
                }
            });
        }
        
        async processRegularFile(file, targetPath) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const content = e.target.result;
                        
                        // Construct the full file path
                        const fileName = file.name;
                        const fullPath = targetPath === '/' ? `/${fileName}` : `${targetPath}/${fileName}`;
                        
                        // Store the file in the file system
                        const success = this.fileSystem.writeFile(this.currentProject, fullPath, content);
                        
                        if (success) {
                            this.logger.log('DragDrop', 'File added successfully', { 
                                fileName, 
                                fullPath,
                                size: file.size 
                            });
                            resolve();
                        } else {
                            reject(new Error('Failed to write file to storage'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                
                reader.onerror = () => {
                    reject(new Error('Failed to read file'));
                };
                
                // Read file as text (you might want to handle binary files differently)
                if (file.type.startsWith('text/') || file.name.match(/\.(js|json|html|css|md|txt|java|py|cpp|c|h)$/i)) {
                    reader.readAsText(file);
                } else {
                    // For binary files, read as data URL or handle as needed
                    reader.readAsText(file); // For now, try to read as text
                }
            });
        }

        close() {
            this.apiManager.clearActivityTimeout();
            this.stopHeartbeat();
            // Since we replaced the entire page, just reload to restore original
            this.logger.log('App', 'Closing - reloading page to restore original interface');
            window.location.reload();
        }
    }

    window.StreamingChatApp = StreamingChatApp;

})();

// ===== config.js =====
(function() {
    'use strict';

    window.StreamingChatConfig = {
        STORAGE_KEY: 'ai_chat_overlay_streaming_data',
        PROJECTS_KEY: 'ai_chat_projects',
        HEARTBEAT_INTERVAL: 60000, // 60 seconds
        HEARTBEAT_MESSAGE: 'respond "k"',
        OVERALL_TIMEOUT: 10 * 60 * 1000, // 10 minutes
        POLLING_INTERVAL: 1000, // 1 second
        SESSION_ID: '11111111111111111111', // 20 ones
        NEW_CHAT_ENDPOINT: '/api/v1/chats/new',
        GET_CHAT_ENDPOINT: '/api/v1/chats/',
        COMPLETIONS_ENDPOINT: '/api/chat/completions',
        
        APP_ENDPOINTS: [
            '/api/v1/chats/new',
            '/api/v1/chats/',
            '/api/chat/completions'
        ]
    };

})();

// ===== fetch-blocker.js =====
(function() {
    'use strict';

    window.StreamingChatFetchBlocker = {
        enable: () => {
            const originalFetch = window.fetch;
            const Logger = window.StreamingChatLogger;
            const Config = window.StreamingChatConfig;
            
            window.fetch = function(url, options = {}) {
                // Check if this request is from our app
                const isAppRequest = Config.APP_ENDPOINTS.some(endpoint => {
                    if (typeof url === 'string') {
                        return url.includes(endpoint);
                    } else if (url && url.href) {
                        return url.href.includes(endpoint);
                    }
                    return false;
                });
                
                if (isAppRequest) {
                    Logger.log('FetchBlock', 'Allowing app request', { url: url.toString() });
                    return originalFetch.call(this, url, options);
                } else {
                    Logger.log('FetchBlock', 'Blocking non-app request', { url: url.toString() });
                    // Return a rejected promise to block the request
                    return Promise.reject(new Error('Request blocked: not from streaming chat app'));
                }
            };
            
            Logger.log('FetchBlock', 'Fetch blocking enabled - only app requests allowed');
        }
    };

})();

// ===== file-system.js =====
(function() {
    'use strict';

    class FileSystemManager {
        constructor() {
            this.logger = window.StreamingChatLogger;
            this.logger.log('FileSystem', 'Initializing File System Manager');
        }

        getFileKey(projectId, filePath) {
            // Clean the path to ensure consistency
            const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            return `file-system.${projectId}.${cleanPath}`;
        }

        writeFile(projectId, filePath, content) {
            try {
                const key = this.getFileKey(projectId, filePath);
                localStorage.setItem(key, content);
                this.logger.log('FileSystem', 'File written', { projectId, filePath, size: content.length });
                return true;
            } catch (error) {
                this.logger.error('FileSystem', 'Failed to write file', error);
                return false;
            }
        }

        readFile(projectId, filePath) {
            try {
                const key = this.getFileKey(projectId, filePath);
                const content = localStorage.getItem(key);
                this.logger.log('FileSystem', 'File read', { projectId, filePath, found: !!content });
                return content;
            } catch (error) {
                this.logger.error('FileSystem', 'Failed to read file', error);
                return null;
            }
        }

        deleteFile(projectId, filePath) {
            try {
                const key = this.getFileKey(projectId, filePath);
                localStorage.removeItem(key);
                this.logger.log('FileSystem', 'File deleted', { projectId, filePath });
                return true;
            } catch (error) {
                this.logger.error('FileSystem', 'Failed to delete file', error);
                return false;
            }
        }

        listFiles(projectId) {
            try {
                const prefix = `file-system.${projectId}.`;
                const files = [];

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(prefix)) {
                        const filePath = key.substring(prefix.length);
                        files.push('/' + filePath);
                    }
                }

                this.logger.log('FileSystem', 'Files listed', { projectId, count: files.length });
                return files.sort();
            } catch (error) {
                this.logger.error('FileSystem', 'Failed to list files', error);
                return [];
            }
        }

        searchFiles(projectId, query) {
            try {
                const results = [];
                const files = this.listFiles(projectId);

                files.forEach(filePath => {
                    const content = this.readFile(projectId, filePath);
                    if (content && content.toLowerCase().includes(query.toLowerCase())) {
                        const lines = content.split('\n');
                        const matchingLines = [];

                        lines.forEach((line, index) => {
                            if (line.toLowerCase().includes(query.toLowerCase())) {
                                matchingLines.push({
                                    line_number: index + 1,
                                    content: line.trim()
                                });
                            }
                        });

                        if (matchingLines.length > 0) {
                            results.push({
                                file_path: filePath,
                                matches: matchingLines
                            });
                        }
                    }
                });

                this.logger.log('FileSystem', 'Search completed', { 
                    projectId, 
                    query, 
                    filesSearched: files.length, 
                    filesWithMatches: results.length 
                });
                
                return results;
            } catch (error) {
                this.logger.error('FileSystem', 'Search failed', error);
                return [];
            }
        }
    }

    window.StreamingChatFileSystem = FileSystemManager;

})();

// ===== logger.js =====
(function() {
    'use strict';

    window.StreamingChatLogger = {
        log: (category, message, data = null) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${category}] ${message}`;
            console.log(logMessage, data || '');
        },
        error: (category, message, error = null) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${category}] ERROR: ${message}`;
            console.error(logMessage, error || '');
        },
        warn: (category, message, data = null) => {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${category}] WARNING: ${message}`;
            console.warn(logMessage, data || '');
        }
    };

})();

// ===== project-manager.js =====
(function() {
    'use strict';

    class ProjectManager {
        constructor() {
            this.logger = window.StreamingChatLogger;
            this.config = window.StreamingChatConfig;
            this.utils = window.StreamingChatUtils;
            this.logger.log('ProjectManager', 'Initializing Project Manager');
        }

        saveProjects(projects) {
            try {
                localStorage.setItem(this.config.PROJECTS_KEY, JSON.stringify(projects));
                return true;
            } catch (error) {
                this.logger.error('ProjectManager', 'Failed to save projects', error);
                return false;
            }
        }

        loadProjects() {
            try {
                const data = localStorage.getItem(this.config.PROJECTS_KEY);
                return data ? JSON.parse(data) : [];
            } catch (error) {
                this.logger.error('ProjectManager', 'Failed to load projects', error);
                return [];
            }
        }

        createProject(name) {
            const projects = this.loadProjects();
            const project = {
                id: this.utils.generateUUID(),
                name: name,
                created: Date.now(),
                files: []
            };

            projects.push(project);
            this.saveProjects(projects);

            this.logger.log('ProjectManager', 'Project created', { 
                id: project.id, 
                name: project.name 
            });

            return project;
        }

        getProject(id) {
            const projects = this.loadProjects();
            return projects.find(p => p.id === id);
        }

        listProjects() {
            return this.loadProjects();
        }

        getAllProjects() {
            return this.loadProjects();
        }

        deleteProject(id) {
            const projects = this.loadProjects();
            const index = projects.findIndex(p => p.id === id);
            
            if (index !== -1) {
                const project = projects[index];
                projects.splice(index, 1);
                this.saveProjects(projects);

                this.logger.log('ProjectManager', 'Project deleted', { 
                    id: project.id, 
                    name: project.name 
                });

                return true;
            }

            return false;
        }

        updateProject(id, updates) {
            const projects = this.loadProjects();
            const project = projects.find(p => p.id === id);
            
            if (project) {
                Object.assign(project, updates);
                this.saveProjects(projects);

                this.logger.log('ProjectManager', 'Project updated', { 
                    id: project.id, 
                    updates 
                });

                return project;
            }

            return null;
        }
    }

    window.StreamingChatProjectManager = ProjectManager;

})();

// ===== streaming-parser.js =====
(function() {
    'use strict';

    class StreamingParser {
        constructor() {
            this.logger = window.StreamingChatLogger;
            this.buffer = '';
            this.completeOutput = '';
            this.toolUses = [];
            this.responseType = null; // 'tool_use' or 'message'
            this.logger.log('StreamingParser', 'Initializing Streaming Parser');
        }

        reset() {
            this.buffer = '';
            this.completeOutput = '';
            this.toolUses = [];
            this.responseType = null;
            this.logger.log('StreamingParser', 'Parser reset');
        }

        processChunk(chunk) {
            this.buffer += chunk;
            this.completeOutput += chunk;

            // Detect response type on first chunk if not already determined
            if (this.responseType === null && this.buffer.trim().length > 0) {
                const trimmedBuffer = this.buffer.trim();
                if (trimmedBuffer.startsWith('<tool')) {
                    this.responseType = 'tool_use';
                    this.logger.log('StreamingParser', 'Detected tool use response');
                } else {
                    this.responseType = 'message';
                    this.logger.log('StreamingParser', 'Detected message response');
                }
            }

            const parseResult = {
                displayText: chunk,
                toolUses: [],
                responseType: this.responseType
            };

            // Look for complete tool use patterns in the buffer
            // Use a more robust regex that handles nested JSON properly
            const toolUseRegex = /<tool_use>([\s\S]*?)<\/tool_use>/g;
            let match;
            const newToolUses = [];

            // Find all complete tool uses in the current buffer
            while ((match = toolUseRegex.exec(this.buffer)) !== null) {
                try {
                    const jsonStr = match[1].trim();
                    const toolData = JSON.parse(jsonStr);
                    
                    // Check if this is a new tool use (not already processed)
                    const isNewToolUse = !this.toolUses.some(existing => 
                        existing.fullMatch === match[0]
                    );
                    
                    if (isNewToolUse) {
                        const toolUse = {
                            fullMatch: match[0],
                            data: toolData,
                            position: match.index
                        };
                        
                        this.toolUses.push(toolUse);
                        newToolUses.push(toolUse);
                        
                        parseResult.toolUses.push({
                            fullMatch: match[0],
                            data: toolData
                        });
                    }
                } catch (e) {
                    this.logger.warn('StreamingParser', 'Failed to parse tool JSON', { 
                        json: match[1].substring(0, 100) + '...' 
                    });
                }
            }

            // Remove ALL tool use text from the display text (current chunk)
            let cleanChunk = chunk;
            this.toolUses.forEach(toolUse => {
                // Only remove parts of tool uses that appear in this chunk
                const toolUseText = toolUse.fullMatch;
                if (cleanChunk.includes(toolUseText)) {
                    cleanChunk = cleanChunk.replace(toolUseText, '');
                } else {
                    // Handle partial tool uses in chunks
                    const toolUseStart = toolUseText.indexOf('<tool_use>');
                    const toolUseEnd = toolUseText.indexOf('</tool_use>') + '</tool_use>'.length;
                    
                    // Remove any part of the tool use that appears in this chunk
                    for (let i = toolUseStart; i < toolUseEnd; i++) {
                        const partialText = toolUseText.substring(i);
                        if (cleanChunk.includes(partialText)) {
                            cleanChunk = cleanChunk.replace(partialText, '');
                            break;
                        }
                    }
                }
            });

            parseResult.displayText = cleanChunk;
            return parseResult;
        }

        getToolUses() {
            return this.toolUses.map(tu => tu);
        }

        getCompleteOutput() {
            // Return output with tool use tags removed
            let cleanOutput = this.completeOutput;
            
            // Remove all tool use text in order of appearance (to handle overlaps correctly)
            const sortedToolUses = this.toolUses
                .slice()
                .sort((a, b) => a.position - b.position);
                
            sortedToolUses.forEach(toolUse => {
                cleanOutput = cleanOutput.replace(toolUse.fullMatch, '');
            });
            
            // Clean up any extra whitespace left by tool use removal
            cleanOutput = cleanOutput.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines -> double newline
            cleanOutput = cleanOutput.trim();
            
            return cleanOutput;
        }

        getResponseType() {
            return this.responseType;
        }

        isToolUseResponse() {
            return this.responseType === 'tool_use';
        }

        isMessageResponse() {
            return this.responseType === 'message';
        }
    }

    window.StreamingChatParser = StreamingParser;

})();

// ===== tool-manager.js =====
(function() {
    'use strict';

    class ToolManager {
        constructor(fileSystem) {
            this.logger = window.StreamingChatLogger;
            this.fileSystem = fileSystem;
            this.activeProjects = [];
            this.logger.log('ToolManager', 'Initializing Tool Manager');
        }

        setActiveProjects(projectIds) {
            this.activeProjects = Array.isArray(projectIds) ? projectIds : [projectIds];
            this.logger.log('ToolManager', 'Active projects updated', { 
                activeProjects: this.activeProjects 
            });
        }

        async executeTool(toolData) {
            this.logger.log('ToolManager', 'Executing tool', { 
                tool_type: toolData.tool_type,
                activeProjects: this.activeProjects 
            });

            try {
                switch (toolData.tool_type) {
                    case 'read_file':
                        return await this.executeReadFile(toolData);
                    case 'write_file':
                        return await this.executeWriteFile(toolData);
                    case 'search_files':
                        return await this.executeSearchFiles(toolData);
                    default:
                        throw new Error(`Unknown tool type: ${toolData.tool_type}`);
                }
            } catch (error) {
                this.logger.error('ToolManager', 'Tool execution failed', error);
                return {
                    tool_type: toolData.tool_type,
                    error: error.message,
                    results: []
                };
            }
        }

        async executeReadFile(toolData) {
            const results = [];

            if (!toolData.file_path) {
                throw new Error('file_path is required for read_file tool');
            }

            for (const projectId of this.activeProjects) {
                const content = this.fileSystem.readFile(projectId, toolData.file_path);
                
                if (content !== null) {
                    results.push({
                        project_id: projectId,
                        file_path: toolData.file_path,
                        content: content,
                        size: content.length
                    });
                } else {
                    results.push({
                        project_id: projectId,
                        file_path: toolData.file_path,
                        error: 'File not found'
                    });
                }
            }

            return {
                tool_type: 'read_file',
                file_path: toolData.file_path,
                results: results
            };
        }

        async executeWriteFile(toolData) {
            const results = [];

            if (!toolData.file_path) {
                throw new Error('file_path is required for write_file tool');
            }

            if (toolData.content === undefined) {
                throw new Error('content is required for write_file tool');
            }

            for (const projectId of this.activeProjects) {
                const success = this.fileSystem.writeFile(projectId, toolData.file_path, toolData.content);
                
                if (success) {
                    results.push({
                        project_id: projectId,
                        file_path: toolData.file_path,
                        content_size: toolData.content.length,
                        status: 'success'
                    });
                } else {
                    results.push({
                        project_id: projectId,
                        file_path: toolData.file_path,
                        status: 'failed',
                        error: 'Failed to write file'
                    });
                }
            }

            return {
                tool_type: 'write_file',
                file_path: toolData.file_path,
                results: results
            };
        }

        async executeSearchFiles(toolData) {
            const results = [];

            if (!toolData.query) {
                throw new Error('query is required for search_files tool');
            }

            for (const projectId of this.activeProjects) {
                const searchResults = this.fileSystem.searchFiles(projectId, toolData.query);
                
                if (searchResults.length > 0) {
                    results.push({
                        project_id: projectId,
                        query: toolData.query,
                        matches: searchResults
                    });
                } else {
                    results.push({
                        project_id: projectId,
                        query: toolData.query,
                        matches: []
                    });
                }
            }

            return {
                tool_type: 'search_files',
                query: toolData.query,
                results: results
            };
        }
    }

    window.StreamingChatToolManager = ToolManager;

})();

// ===== ui-builder.js =====
(function() {
    'use strict';

    window.StreamingChatUIBuilder = {
        createHTML: () => {
            return `
                <div class="streaming-chat-ide">
                    <!-- Home Screen -->
                    <div class="screen home-screen active" id="home-screen">
                        <div class="left-panel">
                            <div class="projects-list">
                                <div class="projects-header">
                                    <h2>Projects</h2>
                                </div>
                                <div id="projects-list" class="project-items">
                                    <!-- Projects will be populated here -->
                                </div>
                                <button id="new-project-btn" class="btn btn-new-project">+ New Project</button>
                            </div>
                        </div>
                        
                        <div class="right-panel">
                            <div class="home-chat-header">
                                <h2>General Chat</h2>
                            </div>
                            
                            <div class="editor-content">
                                <div class="tab-pane chat-container active">
                                    <div class="messages" id="home-messages"></div>
                                </div>
                            </div>
                            <div class="input-container">
                                <div class="status-bar" id="home-status">Ready</div>
                                <div class="input-wrapper">
                                    <textarea id="home-input" 
                                            placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
                                            rows="3"></textarea>
                                    <button id="home-send-btn" class="btn btn-primary">Send</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Project Screen -->
                    <div class="screen project-screen" id="project-screen">
                        <div class="left-panel">
                            <div class="project-header">
                                <button id="back-btn" class="btn-back">← Back</button>
                                <span id="current-project-name" class="project-name">Project Name</span>
                            </div>
                            
                            <div class="file-explorer" id="file-explorer">
                                <div class="no-project">No files in project</div>
                            </div>
                        </div>
                        
                        <div class="right-panel">
                            <div class="editor-tabs" id="editor-tabs">
                                <div class="editor-tab chat-tab active" data-tab="chat">
                                    💬 Chat
                                </div>
                            </div>
                            
                            <div class="editor-content" id="editor-content">
                                <div class="tab-pane chat-container active" data-tab="chat">
                                    <div class="messages" id="messages-streaming"></div>
                                </div>
                            </div>
                            
                            <div class="input-container">
                                <div class="status-bar" id="status-streaming">Ready</div>
                                <div class="input-wrapper">
                                    <textarea id="user-input-streaming" 
                                            placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
                                            rows="3"></textarea>
                                    <button id="send-btn-streaming" class="btn btn-primary">Send</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Drag and Drop Overlay -->
                <div class="drag-overlay" id="drag-overlay">
                    <div class="drag-message" id="drag-message">
                        Drop files here to add to project
                    </div>
                </div>
            `;
        },

        createCSS: () => {
            return `
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #1a1a1a;
                    color: #e0e0e0;
                    height: 100vh;
                    overflow: hidden;
                }

                .streaming-chat-ide {
                    position: relative;
                    height: 100vh;
                    background: #1a1a1a;
                    overflow: hidden;
                }

                .screen {
                    display: none;
                    height: 100vh;
                    width: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .screen.active {
                    display: flex;
                }

                .left-panel {
                    width: 300px;
                    background: #252525;
                    border-right: 1px solid #444;
                    display: flex;
                    flex-direction: column;
                }

                .right-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }

                /* Home Screen Styles */
                .projects-list {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .projects-header {
                    padding: 20px 15px 15px 15px;
                    border-bottom: 1px solid #444;
                }

                .projects-header h2 {
                    color: #e0e0e0;
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }

                .project-items {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 0;
                }

                .project-item {
                    padding: 12px 20px;
                    margin: 2px 10px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    border-left: 3px solid transparent;
                }

                .project-item:hover {
                    background: #333;
                    border-left-color: #0d7377;
                }

                .project-item-name {
                    font-size: 14px;
                    color: #e0e0e0;
                    font-weight: 500;
                }

                .project-item-path {
                    font-size: 11px;
                    color: #888;
                    margin-top: 2px;
                    font-family: monospace;
                }

                .btn-new-project {
                    margin: 15px;
                    background: #0d7377;
                    border: none;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .btn-new-project:hover {
                    background: #0a5d61;
                }

                .home-chat-header {
                    padding: 20px 20px 15px 20px;
                    border-bottom: 1px solid #444;
                    background: #2d2d2d;
                }

                .home-chat-header h2 {
                    color: #e0e0e0;
                    font-size: 18px;
                    font-weight: 600;
                    margin: 0;
                }

                /* Project Screen Styles */
                .project-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px 20px;
                    border-bottom: 1px solid #444;
                    background: #2d2d2d;
                    height: 50px; /* Fixed height to match tabs */
                }

                .btn-back {
                    background: #444;
                    border: none;
                    color: #e0e0e0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 13px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .btn-back:hover {
                    background: #555;
                }

                .project-name {
                    color: #e0e0e0;
                    font-size: 16px;
                    font-weight: 600;
                    flex: 1;
                }

                .project-selector {
                    padding: 15px;
                    border-bottom: 1px solid #444;
                }

                #project-dropdown {
                    width: 100%;
                    background: #333;
                    border: 1px solid #555;
                    color: #e0e0e0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 13px;
                }

                .file-explorer {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .file-explorer-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 20px;
                    border-bottom: 1px solid #444;
                    background: #2d2d2d;
                    font-size: 14px;
                    font-weight: 500;
                    color: #e0e0e0;
                }

                .no-project, .empty-state {
                    color: #666;
                    text-align: center;
                    margin-top: 50px;
                    font-size: 14px;
                    padding: 20px;
                }

                .no-projects {
                    color: #666;
                    text-align: center;
                    padding: 40px 20px;
                    font-size: 14px;
                    font-style: italic;
                }

                .file-tree {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    font-size: 13px;
                }

                .file-item, .folder-item {
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 3px;
                    margin: 1px 0;
                }

                .file-item:hover, .folder-item:hover {
                    background: #333;
                }

                .folder-item {
                    font-weight: 500;
                }

                .folder-icon {
                    display: inline-block;
                    margin-right: 6px;
                }

                /* Nested file tree indentation */
                .file-tree .file-tree {
                    margin-left: 20px;
                    border-left: 1px solid #444;
                    padding-left: 8px;
                }

                .file-tree .file-tree .file-item,
                .file-tree .file-tree .folder-item {
                    padding-left: 4px;
                }

                /* Drag and Drop Styles */
                .file-tree.drag-over-root {
                    background: rgba(13, 115, 119, 0.1);
                    border: 2px dashed #0d7377;
                    border-radius: 6px;
                }

                .folder-item.drag-over-folder {
                    background: rgba(13, 115, 119, 0.2);
                    border: 1px solid #0d7377;
                    border-radius: 3px;
                }

                .file-item.drag-over-invalid {
                    background: rgba(244, 67, 54, 0.1);
                    border: 1px solid #f44336;
                    border-radius: 3px;
                    cursor: not-allowed;
                }

                .drag-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                    display: none;
                }

                .drag-overlay.active {
                    display: block;
                }

                .drag-message {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2d2d2d;
                    color: #e0e0e0;
                    padding: 20px 30px;
                    border-radius: 8px;
                    border: 2px solid #0d7377;
                    font-size: 16px;
                    text-align: center;
                }

                .editor-tabs {
                    background: #2d2d2d;
                    border-bottom: 1px solid #444;
                    display: flex;
                    align-items: center;
                    height: 50px; /* Match project header height */
                    overflow-x: auto;
                }

                .editor-tab {
                    padding: 8px 16px;
                    background: #333;
                    border-right: 1px solid #444;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                    position: relative;
                }

                .editor-tab:hover {
                    background: #404040;
                }

                .editor-tab.active {
                    background: #1a1a1a;
                    border-bottom: 2px solid #0d7377;
                }

                .editor-tab .close-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    cursor: pointer;
                    padding: 0;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 2px;
                    font-size: 14px;
                    line-height: 1;
                }

                .editor-tab .close-btn:hover {
                    background: #555;
                    color: white;
                }

                .editor-content {
                    flex: 1;
                    background: #1a1a1a;
                    overflow: hidden;
                    position: relative;
                }

                .tab-pane {
                    display: none;
                    height: 100%;
                }

                .tab-pane.active {
                    display: block;
                }

                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .file-editor-pane {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .file-editor-content {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                }

                .editor-textarea {
                    width: 100%;
                    height: 100%;
                    background: #1a1a1a;
                    border: none;
                    color: #e0e0e0;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                    resize: none;
                    outline: none;
                    padding: 15px;
                    margin: 0;
                }

                .file-actions {
                    background: #2d2d2d;
                    border-bottom: 1px solid #444;
                    padding: 8px 15px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .file-actions .btn {
                    padding: 4px 8px;
                    font-size: 11px;
                }

                .file-path {
                    flex: 1;
                    font-family: monospace;
                    font-size: 12px;
                    color: #aaa;
                }

                .new-file-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #0d7377;
                    border: none;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .new-file-btn:hover {
                    background: #0a5d61;
                }

                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    min-height: 0; /* Allows flex item to shrink below content size */
                    max-height: 100%; /* Ensures it doesn't exceed container */
                }

                .message {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 8px;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .message.user {
                    align-self: flex-end;
                    background: #0d7377;
                    border: 1px solid #14a085;
                }

                .message.assistant {
                    align-self: flex-start;
                    background: #2d2d2d;
                    border: 1px solid #444;
                }

                .message.streaming {
                    border-left: 3px solid #ffa726;
                }

                .message.loading {
                    border-left: 3px solid #2196f3;
                    padding: 8px 16px;
                    min-height: 20px;
                    display: flex;
                    align-items: center;
                }

                .loading-animation {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #e0e0e0;
                }

                .loading-star {
                    font-size: 16px;
                    color: #2196f3;
                    transition: color 0.2s ease;
                }

                .loading-text {
                    color: #aaa;
                    font-style: italic;
                }


                .message.tool-result {
                    border-left: 3px solid #9c27b0;
                    background: #2a2a2a;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .message.tool-result:hover {
                    background: #333;
                }

                .tool-use-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #3a3a3a;
                    border: 1px solid #555;
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin: 2px 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .tool-use-indicator:hover {
                    background: #444;
                }

                .tool-icon {
                    font-size: 14px;
                }

                .tool-main {
                    font-size: 12px;
                    color: #ccc;
                    font-family: monospace;
                }

                .tool-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    font-weight: bold;
                }

                .tool-title {
                    color: #e0e0e0;
                }

                .tool-preview {
                    font-size: 12px;
                    color: #aaa;
                    white-space: pre-line;
                }

                /* New tool use bubble styles */
                .message.tool-use {
                    border-left: 3px solid #2196F3;
                    background: #2a2a3a;
                    margin: 10px 0;
                }

                .tool-status {
                    margin-left: auto;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: normal;
                    background: #555;
                    color: #ccc;
                }

                .tool-status.success {
                    background: #4CAF50;
                    color: white;
                }

                .tool-status.error {
                    background: #f44336;
                    color: white;
                }

                .tool-request {
                    margin-top: 8px;
                    border-top: 1px solid #444;
                    padding-top: 8px;
                }

                .tool-request-label, .tool-result-label {
                    font-size: 11px;
                    color: #888;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .tool-request-content, .tool-result-content {
                    font-family: monospace;
                    font-size: 12px;
                    background: #1a1a1a;
                    border: 1px solid #444;
                    border-radius: 4px;
                    padding: 8px;
                    color: #e0e0e0;
                    white-space: pre-wrap;
                    overflow-x: auto;
                }

                .tool-result-section {
                    margin-top: 8px;
                    border-top: 1px solid #444;
                    padding-top: 8px;
                }

                .tool-result-content.error {
                    background: #2a1a1a;
                    border-color: #f44336;
                    color: #ffcdd2;
                }

                .input-container {
                    border-top: 1px solid #444;
                    background: #252525;
                }

                .status-bar {
                    padding: 6px 20px;
                    font-size: 12px;
                    border-bottom: 1px solid #444;
                    background: #2d2d2d;
                }

                .status-bar.ready { color: #4caf50; }
                .status-bar.error { color: #f44336; }
                .status-bar.streaming { color: #ffa726; }
                .status-bar.success { color: #4caf50; }

                .input-wrapper {
                    display: flex;
                    padding: 15px 20px;
                    gap: 10px;
                    align-items: flex-end;
                }

                #user-input-streaming {
                    flex: 1;
                    background: #333;
                    border: 1px solid #555;
                    color: #e0e0e0;
                    padding: 10px 12px;
                    border-radius: 4px;
                    resize: vertical;
                    min-height: 40px;
                    max-height: 120px;
                    font-family: inherit;
                    font-size: 14px;
                    line-height: 1.4;
                }

                #user-input-streaming:focus {
                    outline: none;
                    border-color: #0d7377;
                }

                .btn {
                    background: #0d7377;
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }

                .btn:hover {
                    background: #0a5d61;
                }

                .btn:disabled {
                    background: #666;
                    cursor: not-allowed;
                }

                .btn-small {
                    padding: 6px 12px;
                    font-size: 11px;
                }

                .btn-primary {
                    background: #0d7377;
                }

                .btn-secondary {
                    background: #666;
                }

                /* Custom scrollbars */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                ::-webkit-scrollbar-track {
                    background: #2d2d2d;
                }

                ::-webkit-scrollbar-thumb {
                    background: #555;
                    border-radius: 4px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: #666;
                }
            `;
        },

        replacePageContent: () => {
            const Logger = window.StreamingChatLogger;
            Logger.log('UI', 'Completely replacing page content');
            
            // Clear entire page
            document.head.innerHTML = '';
            document.body.innerHTML = '';
            
            // Add basic meta tags
            const meta = document.createElement('meta');
            meta.setAttribute('charset', 'UTF-8');
            document.head.appendChild(meta);
            
            const viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            document.head.appendChild(viewport);
            
            // Add title
            const title = document.createElement('title');
            title.textContent = 'AI Chat Streaming IDE';
            document.head.appendChild(title);
            
            // Add CSS
            const style = document.createElement('style');
            style.textContent = window.StreamingChatUIBuilder.createCSS();
            document.head.appendChild(style);
            
            // Set body HTML
            document.body.innerHTML = window.StreamingChatUIBuilder.createHTML();
            
            Logger.log('UI', 'Page content replaced successfully');
            return document.body;
        }
    };

})();

// ===== utils.js =====
(function() {
    'use strict';

    window.StreamingChatUtils = {
        generateUUID: () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0;
                const v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        
        get13DigitTimestamp: () => {
            return Date.now();
        },
        
        get10DigitTimestamp: () => {
            return Math.floor(Date.now() / 1000);
        },

        buildFileTree: (files, maxDepth = 2) => {
            const tree = {};
            
            files.forEach(filePath => {
                const parts = filePath.split('/').filter(p => p);
                let current = tree;
                
                for (let i = 0; i < Math.min(parts.length, maxDepth + 1); i++) {
                    const part = parts[i];
                    const isFile = i === parts.length - 1;
                    const isAtMaxDepth = i === maxDepth;
                    
                    if (isAtMaxDepth && !isFile) {
                        // At max depth and it's a directory, show as "..."
                        if (!current['...']) {
                            current['...'] = { __isMoreFiles: true };
                        }
                        break;
                    }
                    
                    if (!current[part]) {
                        current[part] = isFile ? { __isFile: true, path: filePath } : {};
                    }
                    
                    if (!isFile) {
                        current = current[part];
                    }
                }
            });
            
            return tree;
        },

        renderFileTreeText: (tree, indent = '') => {
            let result = '';
            const items = Object.keys(tree).sort();
            
            for (let i = 0; i < items.length; i++) {
                const name = items[i];
                const item = tree[name];
                const isLast = i === items.length - 1;
                const connector = isLast ? '└── ' : '├── ';
                
                if (item.__isFile) {
                    result += `${indent}${connector}📄 ${name}\n`;
                } else if (item.__isMoreFiles) {
                    result += `${indent}${connector}... (more files)\n`;
                } else {
                    result += `${indent}${connector}📁 ${name}/\n`;
                    const nextIndent = indent + (isLast ? '    ' : '│   ');
                    result += window.StreamingChatUtils.renderFileTreeText(item, nextIndent);
                }
            }
            
            return result;
        }
    };

})();

// ===== zz-app-starter.js (INITIALIZATION) =====
(function() {
    'use strict';

    // Wait for DOM to be ready
    function initializeApp() {
        const Logger = window.StreamingChatLogger;
        Logger.log('Main', 'Loading Streaming AI Chat Overlay');
        
        try {
            const app = new window.StreamingChatApp();
            app.init();
            
            // Expose to window for debugging and external access
            window.aiChatOverlayStreaming = app;
            
            Logger.log('Main', 'Streaming AI Chat Overlay loaded successfully');
            console.log('Streaming AI Chat Overlay loaded! Access via window.aiChatOverlayStreaming');
            
        } catch (error) {
            Logger.error('Main', 'Failed to initialize app', error);
            console.error('Failed to initialize Streaming AI Chat Overlay:', error);
        }
    }

    // Initialize immediately since we're replacing the entire page
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }

})();
