package com.ainetsoft.service;

import com.azure.ai.formrecognizer.documentanalysis.DocumentAnalysisClient;
import com.azure.ai.formrecognizer.documentanalysis.DocumentAnalysisClientBuilder;
import com.azure.ai.formrecognizer.documentanalysis.models.*;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.core.util.BinaryData;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class AzureOCRService {

    @Value("${azure.ocr.key}")
    private String key;

    @Value("${azure.ocr.endpoint}")
    private String endpoint;

    private DocumentAnalysisClient client;

    /**
     * Data Transfer Object to return both ID Number and the Document Side.
     */
    @Data
    @AllArgsConstructor
    public static class IdAnalysisResult {
        private String idNumber;
        private String side; // "front", "back", or "unknown"
    }

    @PostConstruct
    public void init() {
        log.info("Initializing Azure Document Intelligence client...");
        this.client = new DocumentAnalysisClientBuilder()
                .credential(new AzureKeyCredential(key))
                .endpoint(endpoint)
                .buildClient();
    }

    /**
     * Fully analyzes an ID document to extract the number and determine which side was uploaded.
     */
    public IdAnalysisResult analyzeIdDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return new IdAnalysisResult(null, "unknown");
        }

        try {
            log.info("AI Analysis started for: {}", file.getOriginalFilename());
            BinaryData data = BinaryData.fromBytes(file.getBytes());

            AnalyzeResult analyzeResult = client.beginAnalyzeDocument("prebuilt-idDocument", data)
                    .getFinalResult();

            if (analyzeResult.getDocuments() == null || analyzeResult.getDocuments().isEmpty()) {
                return new IdAnalysisResult(null, "unknown");
            }

            for (AnalyzedDocument document : analyzeResult.getDocuments()) {
                Map<String, DocumentField> fields = document.getFields();

                // 1. Extract ID Number (Standard DocumentNumber or fallback PersonalNumber)
                DocumentField idField = fields.get("DocumentNumber");
                if (idField == null) idField = fields.get("PersonalNumber");

                String extractedId = null;
                if (idField != null && idField.getConfidence() > 0.4) {
                    extractedId = idField.getContent().toUpperCase().replaceAll("[^A-Z0-9]", "");
                }

                // 2. Extract Document Side (AI determines if it's "front" or "back")
                DocumentField sideField = fields.get("DocumentSide");
                String side = "unknown";
                if (sideField != null) {
                    side = sideField.getContent().toLowerCase(); // returns "front" or "back"
                }

                log.info("AI Result -> ID: [{}], Side: [{}]", extractedId, side);
                return new IdAnalysisResult(extractedId, side);
            }

        } catch (IOException e) {
            log.error("IO Error: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Azure OCR Error: {}", e.getMessage());
        }

        return new IdAnalysisResult(null, "unknown");
    }

    /**
     * Legacy method preserved for compatibility during transition.
     */
    public String extractIdNumber(MultipartFile file) {
        return analyzeIdDocument(file).getIdNumber();
    }
}