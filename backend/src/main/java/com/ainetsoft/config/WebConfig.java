package com.ainetsoft.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String dirName = "uploads";
        
        // 1. Ensure the directory structure exists on startup
        File uploadFolder = new File(dirName);
        File cccdFolder = new File(dirName + "/cccd");
        File adsFolder = new File(dirName + "/ads"); // Added for product photos
        
        if (!uploadFolder.exists()) uploadFolder.mkdirs();
        if (!cccdFolder.exists()) cccdFolder.mkdirs();
        if (!adsFolder.exists()) adsFolder.mkdirs();

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        String uploadPath = "file:" + uploadDir.toString() + File.separator;

        /**
         * 2. REGISTER THE MAPPINGS
         * We map BOTH standard and API paths to the physical folder.
         * This ensures /uploads/ads/... works for the frontend components.
         */
        
        // Standard Mapping (Matches your current Frontend format)
        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(0);

        // Legacy/API Mapping (Ensures backward compatibility)
        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(0);

        // 3. Debug Print
        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE ACTIVE");
        System.out.println("Standard Mapping: /" + dirName + "/**");
        System.out.println("API Mapping: /api/" + dirName + "/**");
        System.out.println("Physical Path: " + uploadPath);
        System.out.println("=================================================");
    }
}