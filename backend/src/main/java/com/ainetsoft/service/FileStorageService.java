package com.ainetsoft.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    // Base directory for all uploads
    private final String BASE_UPLOAD_DIR = "uploads";

    /**
     * General method to save a file to a specific subfolder.
     * @param file The multipart file from the request
     * @param subFolder e.g., "cccd", "products", "avatars"
     * @return The relative URL path to be saved in the database
     */
    public String saveFile(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) return null;

        try {
            // 1. Create the specific path: uploads/cccd/ or uploads/products/
            Path uploadPath = Paths.get(BASE_UPLOAD_DIR, subFolder).toAbsolutePath().normalize();
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 2. Generate a unique file name to prevent overwriting
            String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
            String extension = "";
            int dotIndex = originalFileName.lastIndexOf(".");
            if (dotIndex > 0) {
                extension = originalFileName.substring(dotIndex);
            }
            
            String uniqueFileName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

            // 3. Save the file to the disk
            Path targetLocation = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("File saved successfully to: {}", targetLocation);

            // 4. Return the URL path that the Frontend can use
            // This matches the mapping in your WebConfig /api/uploads/**
            return "/api/uploads/" + subFolder + "/" + uniqueFileName;

        } catch (IOException ex) {
            log.error("Could not store file. Error: {}", ex.getMessage());
            throw new RuntimeException("Lỗi khi lưu tệp tin: " + ex.getMessage());
        }
    }

    /**
     * Utility to delete a file if needed (e.g., when a product is deleted)
     */
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        try {
            // Remove the /api/ prefix to get the real disk path
            String relativePath = fileUrl.replace("/api/", "");
            Path filePath = Paths.get(relativePath).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
            log.info("File deleted: {}", filePath);
        } catch (IOException ex) {
            log.warn("Failed to delete file at {}: {}", fileUrl, ex.getMessage());
        }
    }
}