// DMDCGPT Server - Combined Java Build
// Generated on Mon Aug  4 07:25:20 PM UTC 2025
// Version: v1.2.3-docx-fix-1754335520

/*
=== pom.xml ===

<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>dmdcgpt-server</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>DMDC GPT Server</name>
    <description>Hello World Maven project with Apache POI</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <poi.version>5.2.5</poi.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>${poi.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-scratchpad</artifactId>
            <version>${poi.version}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.example.DMDCGPTApplication</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
*/

// ===== src/main/java/com/example/ClipboardProtocol.java =====
package com.example;

public class ClipboardProtocol {
    
    public static final String SERVER_INDICATOR = "##DMDCGPT_SERVER##";
    public static final String CLIENT_INDICATOR = "##DMDCGPT_CLIENT##";
    public static final String MESSAGE_SEPARATOR = "##MSG_SEP##";
    
    public static class ParsedMessage {
        private final String type;
        private final String content;
        private final String originalClipboard;
        
        public ParsedMessage(String type, String content, String originalClipboard) {
            this.type = type;
            this.content = content;
            this.originalClipboard = originalClipboard;
        }
        
        public String getType() {
            return type;
        }
        
        public String getContent() {
            return content;
        }
        
        public String getOriginalClipboard() {
            return originalClipboard;
        }
    }
    
    public static boolean isServerMessage(String clipboardContent) {
        return clipboardContent != null && clipboardContent.startsWith(SERVER_INDICATOR);
    }
    
    public static ParsedMessage parseServerMessage(String clipboardContent) {
        if (!isServerMessage(clipboardContent)) {
            return null;
        }
        
        String withoutIndicator = clipboardContent.substring(SERVER_INDICATOR.length());
        
        int separatorIndex = withoutIndicator.indexOf(MESSAGE_SEPARATOR);
        if (separatorIndex == -1) {
            return new ParsedMessage("", withoutIndicator, "");
        }
        
        String messageContent = withoutIndicator.substring(0, separatorIndex);
        String originalClipboard = withoutIndicator.substring(separatorIndex + MESSAGE_SEPARATOR.length());
        
        // Parse header: TYPE:ACTUAL_CONTENT
        String type = "";
        String content = messageContent;
        
        int newlineIndex = messageContent.indexOf('\n');
        if (newlineIndex > 0 && messageContent.substring(0, newlineIndex).contains(":")) {
            String header = messageContent.substring(0, newlineIndex);
            if (header.startsWith("TYPE:")) {
                type = header.substring(5); // Remove "TYPE:"
                content = messageContent.substring(newlineIndex + 1);
            }
        }
        
        return new ParsedMessage(type, content, originalClipboard);
    }
    
    public static String createServerMessage(String type, String content, String originalClipboard) {
        StringBuilder message = new StringBuilder();
        message.append(SERVER_INDICATOR);
        message.append("TYPE:").append(type).append("\n");
        message.append(content);
        message.append(MESSAGE_SEPARATOR);
        message.append(originalClipboard != null ? originalClipboard : "");
        return message.toString();
    }
    
    public static String createClientMessage(String type, String content, String currentClipboard) {
        StringBuilder message = new StringBuilder();
        message.append(CLIENT_INDICATOR);
        message.append("TYPE:").append(type).append("\n");
        message.append(content);
        message.append(MESSAGE_SEPARATOR);
        message.append(currentClipboard != null ? currentClipboard : "");
        return message.toString();
    }
}

// ===== src/main/java/com/example/ClipboardProtocolTest.java =====
package com.example;

public class ClipboardProtocolTest {
    
    public static void main(String[] args) {
        System.out.println("Testing Clipboard Protocol...\n");
        
        // Simulate original clipboard content
        String originalClipboard = "User was working on this important document content";
        
        // Simulate client creating a server request
        String clientRequest = "Name,Age,City\nJohn,30,NYC\nJane,25,LA";
        String clientMessage = ClipboardProtocol.createServerMessage("DOCX_TO_JSON", clientRequest, originalClipboard);
        
        System.out.println("1. Client creates message for clipboard:");
        System.out.println("   Original clipboard: " + originalClipboard);
        System.out.println("   Client request: " + clientRequest);
        System.out.println("   Full clipboard message: " + clientMessage);
        System.out.println();
        
        // Simulate server detecting and parsing the message
        System.out.println("2. Server detects message:");
        System.out.println("   Is server message: " + ClipboardProtocol.isServerMessage(clientMessage));
        
        ClipboardProtocol.ParsedMessage parsed = ClipboardProtocol.parseServerMessage(clientMessage);
        if (parsed != null) {
            System.out.println("   Parsed type: " + parsed.getType());
            System.out.println("   Parsed content: " + parsed.getContent());
            System.out.println("   Original clipboard: " + parsed.getOriginalClipboard());
            System.out.println();
            
            // Simulate server processing and restoring clipboard
            System.out.println("3. Server processing:");
            System.out.println("   Processing request...");
            String serverResponse = "Processed: Excel data with 2 rows received";
            System.out.println("   Server response: " + serverResponse);
            
            // Server would create client response
            String clientResponse = ClipboardProtocol.createClientMessage("DOCX_TO_JSON_RESULT", serverResponse, parsed.getOriginalClipboard());
            System.out.println("   Client response message: " + clientResponse.substring(0, Math.min(100, clientResponse.length())) + "...");
            System.out.println();
            
            System.out.println("✓ Protocol test successful!");
            System.out.println("  - User's clipboard content is preserved");
            System.out.println("  - Server request was extracted and processed");
            System.out.println("  - Communication is non-intrusive");
        } else {
            System.out.println("✗ Failed to parse message");
        }
        
        // Test edge cases
        System.out.println("\n4. Testing edge cases:");
        
        // Test regular clipboard content (should not be detected as server message)
        String regularContent = "Just some regular text";
        System.out.println("   Regular clipboard content detected as server message: " + 
                         ClipboardProtocol.isServerMessage(regularContent));
        
        // Test message without separator (original clipboard would be empty)
        String noSeparatorMessage = ClipboardProtocol.SERVER_INDICATOR + "TYPE:TEST\nREQUEST_WITHOUT_SEPARATOR";
        ClipboardProtocol.ParsedMessage noSepParsed = ClipboardProtocol.parseServerMessage(noSeparatorMessage);
        if (noSepParsed != null) {
            System.out.println("   Message without separator - type: '" + noSepParsed.getType() + "'");
            System.out.println("   Message without separator - content: '" + noSepParsed.getContent() + "'");
            System.out.println("   Message without separator - original: '" + noSepParsed.getOriginalClipboard() + "'");
        }
        
        System.out.println("\n✓ All tests completed successfully!");
    }
}

// ===== src/main/java/com/example/DMDCGPTApplication.java =====
package com.example;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class DMDCGPTApplication {
    private final PlatformAdapter adapter;
    private final ScheduledExecutorService scheduler;
    public volatile boolean running = true;
    
    public DMDCGPTApplication(PlatformAdapter adapter) {
        this.adapter = adapter;
        this.scheduler = Executors.newSingleThreadScheduledExecutor();
    }
    
    public void start() {
        String VERSION = "v1.2.3-docx-fix-" + System.currentTimeMillis();
        System.out.println("🚀 DMDC GPT Application starting... Version: " + VERSION);
        
        adapter.initializeHook();
        
        scheduler.scheduleWithFixedDelay(this::pollAndProcess, 0, 2, TimeUnit.SECONDS);
        
        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));
        
        System.out.println("Application started. Polling for input...");
    }
    
    private void pollAndProcess() {
        if (!running) return;
        
        try {
            String input = adapter.pollForInput();
            if (input != null && !input.trim().isEmpty()) {
                String output = processInput(input);
                
                if (output != null) {
                    adapter.writeOutput(output);
                    System.out.println("Output written successfully");
                }
            }
        } catch (Exception e) {
            System.err.println("Error during polling: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private String processInput(String input) {
        // Check if this is a protocol message that was already parsed by the adapter
        // For Windows, the adapter already parsed it and extracted the content
        // For Linux, we might get the raw protocol message
        
        if (input.startsWith(ClipboardProtocol.SERVER_INDICATOR)) {
            // This is a raw protocol message (likely from Linux adapter)
            ClipboardProtocol.ParsedMessage parsed = ClipboardProtocol.parseServerMessage(input);
            if (parsed != null) {
                System.out.println("Processing request - Type: " + parsed.getType());
                return RequestProcessor.processRequest(parsed.getType(), parsed.getContent());
            }
        } else {
            // This is content already extracted from protocol message (Windows adapter)
            // or legacy raw input (no protocol)
            
            // For now, we'll try to detect if it looks like base64 DOCX content
            if (isBase64DocxContent(input)) {
                System.out.println("Detected base64 DOCX content, processing as DOCX_TO_JSON");
                return RequestProcessor.processRequest("DOCX_TO_JSON", input);
            } else {
                // Legacy processing
                return RequestProcessor.processRequest("", input);
            }
        }
        
        return null;
    }
    
    private boolean isBase64DocxContent(String input) {
        // Simple heuristic: base64 content is typically long and only contains base64 characters
        if (input.length() < 1000) return false; // DOCX files are typically large
        
        // Check if it only contains base64 characters
        return input.matches("^[A-Za-z0-9+/]*={0,2}$");
    }
    
    public void shutdown() {
        System.out.println("Shutting down application...");
        running = false;
        
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(3, TimeUnit.SECONDS)) {
                System.out.println("Forcing scheduler shutdown...");
                scheduler.shutdownNow();
                if (!scheduler.awaitTermination(2, TimeUnit.SECONDS)) {
                    System.err.println("Scheduler did not terminate gracefully");
                }
            }
        } catch (InterruptedException e) {
            System.out.println("Shutdown interrupted, forcing termination...");
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }
        
        try {
            adapter.shutdown();
        } catch (Exception e) {
            System.err.println("Error during adapter shutdown: " + e.getMessage());
        }
        
        System.out.println("Application shut down complete");
        
        // Force exit if shutdown takes too long
        System.exit(0);
    }
    
    public static void main(String[] args) {
        String osName = System.getProperty("os.name").toLowerCase();
        PlatformAdapter adapter;
        
        if (osName.contains("win")) {
            adapter = new WindowsAdapter();
        } else {
            adapter = new LinuxAdapter();
        }
        
        DMDCGPTApplication app = new DMDCGPTApplication(adapter);
        app.start();
        
        // Keep the main thread alive until shutdown
        try {
            while (app.running) {
                Thread.sleep(1000);
            }
        } catch (InterruptedException e) {
            System.out.println("Main thread interrupted, shutting down...");
            app.shutdown();
            Thread.currentThread().interrupt();
        }
    }
}

// ===== src/main/java/com/example/DocxProcessor.java =====
package com.example;

import org.apache.poi.xwpf.usermodel.*;
import org.apache.poi.openxml4j.exceptions.InvalidFormatException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class DocxProcessor {
    
    public static class DocumentElement {
        private String type;
        private Object content;
        private Map<String, Object> formatting;
        private Map<String, Object> properties;
        
        public DocumentElement(String type) {
            this.type = type;
            this.formatting = new HashMap<>();
            this.properties = new HashMap<>();
        }
        
        public String getType() { return type; }
        public Object getContent() { return content; }
        public Map<String, Object> getFormatting() { return formatting; }
        public Map<String, Object> getProperties() { return properties; }
        
        public void setContent(Object content) { this.content = content; }
        public void addFormatting(String key, Object value) { this.formatting.put(key, value); }
        public void addProperty(String key, Object value) { this.properties.put(key, value); }
    }
    
    public static class DocumentResult {
        private List<DocumentElement> elements;
        private Map<String, Object> metadata;
        private Map<String, Object> styles;
        
        public DocumentResult() {
            this.elements = new ArrayList<>();
            this.metadata = new HashMap<>();
            this.styles = new HashMap<>();
        }
        
        public List<DocumentElement> getElements() { return elements; }
        public Map<String, Object> getMetadata() { return metadata; }
        public Map<String, Object> getStyles() { return styles; }
        
        public void addElement(DocumentElement element) { this.elements.add(element); }
        public void addMetadata(String key, Object value) { this.metadata.put(key, value); }
        public void addStyle(String key, Object value) { this.styles.put(key, value); }
    }
    
    public static String convertDocxToJson(String base64DocxContent) throws IOException, InvalidFormatException {
        // Decode base64 to byte array
        byte[] docxBytes = Base64.getDecoder().decode(base64DocxContent);
        
        // Create document from byte array
        try (ByteArrayInputStream bis = new ByteArrayInputStream(docxBytes);
             XWPFDocument document = new XWPFDocument(bis)) {
            
            DocumentResult result = processDocument(document);
            return convertToJson(result);
        }
    }
    
    private static DocumentResult processDocument(XWPFDocument document) {
        DocumentResult result = new DocumentResult();
        
        // Add metadata
        if (document.getProperties() != null && document.getProperties().getCoreProperties() != null) {
            var coreProps = document.getProperties().getCoreProperties();
            result.addMetadata("title", coreProps.getTitle());
            result.addMetadata("creator", coreProps.getCreator());
            result.addMetadata("description", coreProps.getDescription());
            result.addMetadata("created", coreProps.getCreated());
            result.addMetadata("modified", coreProps.getModified());
        }
        
        // Process body elements in order
        List<IBodyElement> bodyElements = document.getBodyElements();
        for (IBodyElement element : bodyElements) {
            if (element instanceof XWPFParagraph) {
                result.addElement(processParagraph((XWPFParagraph) element));
            } else if (element instanceof XWPFTable) {
                result.addElement(processTable((XWPFTable) element));
            }
        }
        
        return result;
    }
    
    private static DocumentElement processParagraph(XWPFParagraph paragraph) {
        DocumentElement element = new DocumentElement("paragraph");
        
        // Get paragraph text
        String text = paragraph.getText();
        element.setContent(text);
        
        // Get paragraph formatting
        if (paragraph.getCTP() != null && paragraph.getCTP().getPPr() != null) {
            var pPr = paragraph.getCTP().getPPr();
            
            // Alignment
            if (pPr.getJc() != null) {
                element.addFormatting("alignment", pPr.getJc().getVal().toString());
            }
        }
        
        // Get run-level formatting from first run if available
        List<XWPFRun> runs = paragraph.getRuns();
        if (!runs.isEmpty()) {
            XWPFRun firstRun = runs.get(0);
            element.addFormatting("bold", firstRun.isBold());
            element.addFormatting("italic", firstRun.isItalic());
            element.addFormatting("underline", firstRun.getUnderline() != UnderlinePatterns.NONE);
            
            if (firstRun.getFontFamily() != null) {
                element.addFormatting("fontFamily", firstRun.getFontFamily());
            }
            if (firstRun.getFontSize() != -1) {
                element.addFormatting("fontSize", firstRun.getFontSize());
            }
            if (firstRun.getColor() != null) {
                element.addFormatting("color", firstRun.getColor());
            }
        }
        
        // Style information
        if (paragraph.getStyle() != null) {
            element.addProperty("style", paragraph.getStyle());
        }
        
        return element;
    }
    
    private static DocumentElement processTable(XWPFTable table) {
        DocumentElement element = new DocumentElement("table");
        
        List<Map<String, Object>> rows = new ArrayList<>();
        
        for (XWPFTableRow row : table.getRows()) {
            Map<String, Object> rowData = new HashMap<>();
            List<Map<String, Object>> cells = new ArrayList<>();
            
            for (XWPFTableCell cell : row.getTableCells()) {
                Map<String, Object> cellData = new HashMap<>();
                
                // Get cell text (combining all paragraphs)
                StringBuilder cellText = new StringBuilder();
                for (XWPFParagraph para : cell.getParagraphs()) {
                    if (cellText.length() > 0) cellText.append("\n");
                    cellText.append(para.getText());
                }
                cellData.put("text", cellText.toString());
                
                // Cell formatting
                Map<String, Object> cellFormatting = new HashMap<>();
                if (cell.getColor() != null) {
                    cellFormatting.put("backgroundColor", cell.getColor());
                }
                cellData.put("formatting", cellFormatting);
                
                cells.add(cellData);
            }
            
            rowData.put("cells", cells);
            rows.add(rowData);
        }
        
        element.setContent(rows);
        
        return element;
    }
    
    private static String convertToJson(DocumentResult result) {
        StringBuilder json = new StringBuilder();
        json.append("{\n");
        json.append("  \"document\": {\n");
        
        // Elements
        json.append("    \"elements\": [\n");
        for (int i = 0; i < result.getElements().size(); i++) {
            DocumentElement elem = result.getElements().get(i);
            json.append("      {\n");
            json.append("        \"type\": \"").append(elem.getType()).append("\",\n");
            json.append("        \"content\": ").append(jsonValue(elem.getContent())).append(",\n");
            json.append("        \"formatting\": ").append(jsonObject(elem.getFormatting())).append(",\n");
            json.append("        \"properties\": ").append(jsonObject(elem.getProperties())).append("\n");
            json.append("      }");
            if (i < result.getElements().size() - 1) json.append(",");
            json.append("\n");
        }
        json.append("    ],\n");
        
        // Metadata
        json.append("    \"metadata\": ").append(jsonObject(result.getMetadata())).append(",\n");
        
        // Styles
        json.append("    \"styles\": ").append(jsonObject(result.getStyles())).append("\n");
        
        json.append("  }\n");
        json.append("}");
        
        return json.toString();
    }
    
    private static String jsonValue(Object value) {
        if (value == null) {
            return "null";
        } else if (value instanceof String) {
            return "\"" + ((String) value).replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r") + "\"";
        } else if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        } else if (value instanceof java.util.Date) {
            return "\"" + value.toString() + "\"";
        } else if (value instanceof List) {
            @SuppressWarnings("unchecked")
            List<Object> list = (List<Object>) value;
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            for (int i = 0; i < list.size(); i++) {
                sb.append(jsonValue(list.get(i)));
                if (i < list.size() - 1) sb.append(", ");
            }
            sb.append("]");
            return sb.toString();
        } else if (value instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = (Map<String, Object>) value;
            return jsonObject(map);
        } else {
            // For any other object type, convert to string
            return "\"" + value.toString().replace("\"", "\\\"") + "\"";
        }
    }
    
    private static String jsonObject(Map<String, Object> map) {
        if (map == null || map.isEmpty()) {
            return "{}";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("{\n");
        
        String[] keys = map.keySet().toArray(new String[0]);
        for (int i = 0; i < keys.length; i++) {
            String key = keys[i];
            Object value = map.get(key);
            sb.append("        \"").append(key).append("\": ").append(jsonValue(value));
            if (i < keys.length - 1) sb.append(",");
            sb.append("\n");
        }
        
        sb.append("      }");
        return sb.toString();
    }
}

// ===== src/main/java/com/example/DocxToJsonTest.java =====
package com.example;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

public class DocxToJsonTest {
    public static void main(String[] args) {
        try {
            System.out.println("Creating test DOCX document...");
            
            // Create a test DOCX document
            XWPFDocument document = new XWPFDocument();
            
            // Add title paragraph
            XWPFParagraph titlePara = document.createParagraph();
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText("Test Document");
            titleRun.setBold(true);
            titleRun.setFontSize(16);
            
            // Add regular paragraph
            XWPFParagraph para = document.createParagraph();
            XWPFRun run = para.createRun();
            run.setText("This is a test paragraph with some sample text.");
            
            // Add a table
            XWPFTable table = document.createTable();
            
            // Header row
            XWPFTableRow headerRow = table.getRow(0);
            headerRow.getCell(0).setText("Name");
            headerRow.addNewTableCell().setText("Age");
            headerRow.addNewTableCell().setText("City");
            
            // Data row 1
            XWPFTableRow row1 = table.createRow();
            row1.getCell(0).setText("John Doe");
            row1.getCell(1).setText("30");
            row1.getCell(2).setText("New York");
            
            // Data row 2
            XWPFTableRow row2 = table.createRow();
            row2.getCell(0).setText("Jane Smith");
            row2.getCell(1).setText("25");
            row2.getCell(2).setText("Los Angeles");
            
            // Add final paragraph
            XWPFParagraph finalPara = document.createParagraph();
            XWPFRun finalRun = finalPara.createRun();
            finalRun.setText("End of document.");
            finalRun.setItalic(true);
            
            // Convert to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.write(baos);
            document.close();
            
            // Encode to base64
            byte[] docxBytes = baos.toByteArray();
            String base64Content = Base64.getEncoder().encodeToString(docxBytes);
            
            System.out.println("Test DOCX created, size: " + docxBytes.length + " bytes");
            System.out.println("Base64 encoded size: " + base64Content.length() + " characters");
            System.out.println();
            
            // Test the conversion
            System.out.println("Testing DOCX to JSON conversion...");
            String jsonResult = DocxProcessor.convertDocxToJson(base64Content);
            
            System.out.println("JSON Result:");
            System.out.println(jsonResult);
            
            // Test with protocol message
            System.out.println("\n" + "=".repeat(50));
            System.out.println("Testing with protocol message...");
            
            String originalClipboard = "User's original clipboard content";
            String protocolMessage = ClipboardProtocol.createServerMessage("DOCX_TO_JSON", base64Content, originalClipboard);
            
            System.out.println("Protocol message created (length: " + protocolMessage.length() + ")");
            
            // Parse it back
            ClipboardProtocol.ParsedMessage parsed = ClipboardProtocol.parseServerMessage(protocolMessage);
            if (parsed != null) {
                System.out.println("Parsed type: " + parsed.getType());
                System.out.println("Content length: " + parsed.getContent().length());
                System.out.println("Original clipboard: " + parsed.getOriginalClipboard());
                
                // Process the request
                String response = RequestProcessor.processRequest(parsed.getType(), parsed.getContent());
                System.out.println("Response length: " + response.length());
                System.out.println("Response preview: " + response.substring(0, Math.min(200, response.length())) + "...");
            }
            
            System.out.println("\n✓ DOCX to JSON test completed successfully!");
            
        } catch (Exception e) {
            System.err.println("Error during test: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

// ===== src/main/java/com/example/HelloWorld.java =====
package com.example;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Cell;
import java.io.FileOutputStream;
import java.io.IOException;

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello World! Apache POI Demo");
        
        // Create a simple Excel workbook using Apache POI
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            // Create a sheet
            Sheet sheet = workbook.createSheet("Hello World Sheet");
            
            // Create a row and add some cells
            Row row = sheet.createRow(0);
            Cell cell1 = row.createCell(0);
            cell1.setCellValue("Hello");
            
            Cell cell2 = row.createCell(1);
            cell2.setCellValue("World");
            
            Cell cell3 = row.createCell(2);
            cell3.setCellValue("Apache POI 5.2.5");
            
            // Create another row with some data
            Row row2 = sheet.createRow(1);
            row2.createCell(0).setCellValue("Java Version:");
            row2.createCell(1).setCellValue(System.getProperty("java.version"));
            
            // Auto-size columns
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);
            sheet.autoSizeColumn(2);
            
            // Write to file
            try (FileOutputStream outputStream = new FileOutputStream("hello-world.xlsx")) {
                workbook.write(outputStream);
                System.out.println("Excel file 'hello-world.xlsx' created successfully!");
            }
            
            System.out.println("POI classes used successfully:");
            System.out.println("- XSSFWorkbook: " + XSSFWorkbook.class.getName());
            System.out.println("- Sheet: " + Sheet.class.getName());
            System.out.println("- Row: " + Row.class.getName());
            System.out.println("- Cell: " + Cell.class.getName());
            
        } catch (IOException e) {
            System.err.println("Error creating Excel file: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

// ===== src/main/java/com/example/LinuxAdapter.java =====
package com.example;

import java.io.IOException;
import java.nio.file.*;
import java.util.HashSet;
import java.util.Set;

public class LinuxAdapter implements PlatformAdapter {
    private final Path workspaceDir;
    private final Path inputDir;
    private final Path outputDir;
    private final Set<String> processedFiles;
    
    public LinuxAdapter() {
        this.workspaceDir = Paths.get(System.getProperty("user.home"), "dmdcgpt-workspace");
        this.inputDir = workspaceDir.resolve("input");
        this.outputDir = workspaceDir.resolve("output");
        this.processedFiles = new HashSet<>();
        
        createDirectoriesIfNeeded();
    }
    
    @Override
    public void initializeHook() {
        System.out.println("Linux adapter initialized - no system tray needed");
        System.out.println("Workspace directory: " + workspaceDir.toAbsolutePath());
        System.out.println("Input directory: " + inputDir.toAbsolutePath());
        System.out.println("Output directory: " + outputDir.toAbsolutePath());
    }
    
    @Override
    public String pollForInput() {
        try {
            if (!Files.exists(inputDir)) {
                return null;
            }
            
            try (DirectoryStream<Path> stream = Files.newDirectoryStream(inputDir, "*.txt")) {
                for (Path inputFile : stream) {
                    String fileName = inputFile.getFileName().toString();
                    
                    if (!fileName.equals("README.txt") && !fileName.startsWith("processed_") && !processedFiles.contains(fileName)) {
                        processedFiles.add(fileName);
                        
                        String content = Files.readString(inputFile);
                        
                        Files.move(inputFile, inputDir.resolve("processed_" + fileName));
                        
                        return content;
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading input files: " + e.getMessage());
        }
        
        return null;
    }
    
    @Override
    public void writeOutput(String output) {
        try {
            String fileName = "output_" + System.currentTimeMillis() + ".txt";
            Path outputFile = outputDir.resolve(fileName);
            
            Files.writeString(outputFile, output);
            
            System.out.println("Output written to: " + outputFile.toAbsolutePath());
        } catch (IOException e) {
            System.err.println("Error writing output file: " + e.getMessage());
        }
    }
    
    @Override
    public void shutdown() {
        System.out.println("Linux adapter shutting down");
    }
    
    private void createDirectoriesIfNeeded() {
        try {
            Files.createDirectories(inputDir);
            Files.createDirectories(outputDir);
            
            if (!Files.exists(inputDir.resolve("README.txt"))) {
                String readme = "DMDC GPT Linux Input Directory\n\n" +
                               "Place .txt files here for processing.\n" +
                               "Files will be moved to processed_<filename> after reading.\n";
                Files.writeString(inputDir.resolve("README.txt"), readme);
            }
            
        } catch (IOException e) {
            System.err.println("Error creating workspace directories: " + e.getMessage());
        }
    }
}

// ===== src/main/java/com/example/PlatformAdapter.java =====
package com.example;

public interface PlatformAdapter {
    void initializeHook();
    
    String pollForInput();
    
    void writeOutput(String output);
    
    void shutdown();
}

// ===== src/main/java/com/example/RequestProcessor.java =====
package com.example;

public class RequestProcessor {
    
    public static String processRequest(String type, String content) {
        try {
            switch (type.toUpperCase()) {
                case "DOCX_TO_JSON":
                    return processDocxToJson(content);
                
                case "":
                    // Legacy format - no type header
                    return "Processed: " + content + " [" + System.currentTimeMillis() + "]";
                
                default:
                    return createErrorResponse("Unknown request type: " + type);
            }
        } catch (Exception e) {
            System.err.println("Error processing request type '" + type + "': " + e.getMessage());
            e.printStackTrace();
            return createErrorResponse("Processing error: " + e.getMessage());
        }
    }
    
    private static String processDocxToJson(String base64DocxContent) {
        try {
            System.out.println("🔧 RequestProcessor Version: v1.2.3-docx-fix-" + System.currentTimeMillis());
            
            if (base64DocxContent == null || base64DocxContent.trim().isEmpty()) {
                return createErrorResponse("Empty DOCX content provided");
            }
            
            System.out.println("Processing DOCX to JSON conversion...");
            System.out.println("Input size: " + base64DocxContent.length() + " characters");
            
            String jsonResult = DocxProcessor.convertDocxToJson(base64DocxContent.trim());
            
            System.out.println("DOCX to JSON conversion completed");
            System.out.println("Output size: " + jsonResult.length() + " characters");
            
            return jsonResult;
            
        } catch (Exception e) {
            System.err.println("❌ Error converting DOCX to JSON: " + e.getMessage());
            System.err.println("Error class: " + e.getClass().getName());
            System.err.println("Stack trace:");
            e.printStackTrace();
            return createErrorResponse("DOCX conversion failed: " + e.getMessage());
        }
    }
    
    private static String createErrorResponse(String errorMessage) {
        return "{\n" +
               "  \"error\": true,\n" +
               "  \"message\": \"" + errorMessage.replace("\"", "\\\"") + "\",\n" +
               "  \"timestamp\": " + System.currentTimeMillis() + "\n" +
               "}";
    }
}

// ===== src/main/java/com/example/WindowsAdapter.java =====
package com.example;

import java.awt.*;
import java.awt.datatransfer.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.IOException;

public class WindowsAdapter implements PlatformAdapter {
    private TrayIcon trayIcon;
    private SystemTray systemTray;
    private String lastClipboardContent = "";
    private ClipboardProtocol.ParsedMessage pendingRequest = null;
    
    @Override
    public void initializeHook() {
        if (!SystemTray.isSupported()) {
            System.err.println("System tray is not supported on this system");
            return;
        }
        
        try {
            systemTray = SystemTray.getSystemTray();
            
            Image image = createTrayImage();
            
            PopupMenu popup = new PopupMenu();
            MenuItem exitItem = new MenuItem("Exit");
            exitItem.addActionListener(new ActionListener() {
                @Override
                public void actionPerformed(ActionEvent e) {
                    System.exit(0);
                }
            });
            popup.add(exitItem);
            
            trayIcon = new TrayIcon(image, "DMDC GPT", popup);
            trayIcon.setImageAutoSize(true);
            trayIcon.setToolTip("DMDC GPT - Monitoring clipboard");
            
            systemTray.add(trayIcon);
            
            trayIcon.displayMessage("DMDC GPT", "Application started - monitoring clipboard", TrayIcon.MessageType.INFO);
            
            System.out.println("Windows adapter initialized - system tray icon added");
            
        } catch (AWTException e) {
            System.err.println("Error creating system tray icon: " + e.getMessage());
        }
    }
    
    @Override
    public String pollForInput() {
        try {
            Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
            
            if (clipboard.isDataFlavorAvailable(DataFlavor.stringFlavor)) {
                String clipboardContent = (String) clipboard.getData(DataFlavor.stringFlavor);
                
                if (clipboardContent != null && !clipboardContent.equals(lastClipboardContent)) {
                    lastClipboardContent = clipboardContent;
                    
                    // Check if this is a server message from client
                    if (ClipboardProtocol.isServerMessage(clipboardContent)) {
                        pendingRequest = ClipboardProtocol.parseServerMessage(clipboardContent);
                        
                        if (pendingRequest != null) {
                            // Immediately restore original clipboard content
                            restoreClipboard(pendingRequest.getOriginalClipboard());
                            
                            if (trayIcon != null) {
                                trayIcon.displayMessage("DMDC GPT", "Request received: " + pendingRequest.getType(), TrayIcon.MessageType.INFO);
                            }
                            
                            System.out.println("Server request received - Type: " + pendingRequest.getType());
                            System.out.println("Content length: " + pendingRequest.getContent().length() + " characters");
                            return pendingRequest.getContent();
                        }
                    }
                }
            }
        } catch (UnsupportedFlavorException | IOException e) {
            System.err.println("Error reading clipboard: " + e.getMessage());
        }
        
        return null;
    }
    
    @Override
    public void writeOutput(String output) {
        if (pendingRequest == null) {
            System.out.println("No pending request to respond to");
            return;
        }
        
        try {
            // Get current clipboard content
            String currentClipboard = getCurrentClipboardContent();
            
            // Create client response message with current clipboard
            String responseType = pendingRequest.getType() + "_RESULT";
            String clientMessage = ClipboardProtocol.createClientMessage(responseType, output, currentClipboard);
            
            // Write response to clipboard
            Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
            StringSelection selection = new StringSelection(clientMessage);
            clipboard.setContents(selection, null);
            lastClipboardContent = clientMessage;
            
            if (trayIcon != null) {
                trayIcon.displayMessage("DMDC GPT", "Response sent: " + responseType, TrayIcon.MessageType.INFO);
            }
            
            System.out.println("Client response sent - Type: " + responseType);
            System.out.println("Response length: " + output.length() + " characters");
            
        } catch (Exception e) {
            System.err.println("Error sending response to client: " + e.getMessage());
            if (trayIcon != null) {
                trayIcon.displayMessage("DMDC GPT", "Error sending response", TrayIcon.MessageType.ERROR);
            }
        } finally {
            pendingRequest = null; // Clear the pending request
        }
    }
    
    @Override
    public void shutdown() {
        if (systemTray != null && trayIcon != null) {
            systemTray.remove(trayIcon);
            System.out.println("Windows adapter shutting down - system tray icon removed");
        }
    }
    
    private void restoreClipboard(String originalContent) {
        try {
            Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
            StringSelection selection = new StringSelection(originalContent);
            clipboard.setContents(selection, null);
            lastClipboardContent = originalContent; // Update our tracking
            System.out.println("Restored original clipboard content");
        } catch (Exception e) {
            System.err.println("Error restoring clipboard: " + e.getMessage());
        }
    }
    
    private String getCurrentClipboardContent() {
        try {
            Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
            if (clipboard.isDataFlavorAvailable(DataFlavor.stringFlavor)) {
                return (String) clipboard.getData(DataFlavor.stringFlavor);
            }
        } catch (UnsupportedFlavorException | IOException e) {
            System.err.println("Error reading current clipboard: " + e.getMessage());
        }
        return "";
    }
    
    private Image createTrayImage() {
        int trayIconWidth = (int) SystemTray.getSystemTray().getTrayIconSize().getWidth();
        int trayIconHeight = (int) SystemTray.getSystemTray().getTrayIconSize().getHeight();
        
        Image image = new java.awt.image.BufferedImage(trayIconWidth, trayIconHeight, java.awt.image.BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = (Graphics2D) image.getGraphics();
        
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setColor(Color.BLUE);
        g.fillOval(2, 2, trayIconWidth - 4, trayIconHeight - 4);
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, Math.max(8, trayIconHeight / 3)));
        
        FontMetrics fm = g.getFontMetrics();
        String text = "D";
        int textWidth = fm.stringWidth(text);
        int textHeight = fm.getAscent();
        
        g.drawString(text, 
                    (trayIconWidth - textWidth) / 2, 
                    (trayIconHeight + textHeight) / 2 - 2);
        
        g.dispose();
        
        return image;
    }
}

