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
        File adsFolder = new File(dirName + "/ads");
        File licenseFolder = new File(dirName + "/license"); // FIXED: Added for Business Licenses
        
        if (!uploadFolder.exists()) uploadFolder.mkdirs();
        if (!cccdFolder.exists()) cccdFolder.mkdirs();
        if (!adsFolder.exists()) adsFolder.mkdirs();
        if (!licenseFolder.exists()) licenseFolder.mkdirs(); // Ensure this exists!

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        // Ensure trailing slash for Spring Resource locations
        String uploadPath = "file:" + uploadDir.toString() + File.separator;

        /**
         * 2. REGISTER THE MAPPINGS
         */
        
        // Standard Mapping: /uploads/**
        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600); // Added slight caching for better performance

        // API Mapping: /api/uploads/** (Matches your AuthService return values)
        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);

        // 3. Debug Print
        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE ACTIVE");
        System.out.println("Mapped Route: /api/" + dirName + "/**");
        System.out.println("Physical Path: " + uploadPath);
        System.out.println("=================================================");
    }
}