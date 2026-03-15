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
        // 1. Target the 'uploads' folder relative to the project root
        String dirName = "uploads";
        
        // BITNAMILEGACY FIX: (KEPT) Ensure both base and cccd subfolders exist
        File uploadFolder = new File(dirName);
        File cccdFolder = new File(dirName + "/cccd");
        
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
        if (!cccdFolder.exists()) {
            cccdFolder.mkdirs();
        }

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        
        // 2. FIXED PATH MAPPING:
        // We ensure it starts with 'file:' and ends with the correct OS slash.
        // This is the most stable way to let Spring "see" into the /cccd/ folder.
        String uploadPath = "file:" + uploadDir.toString() + File.separator;

        /**
         * 3. Register the mapping
         * Maps 'http://localhost:8080/api/uploads/...' to the physical folder.
         */
        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(0) // Set to 0 for debugging so images update immediately
                .resourceChain(true);

        // 4. Debug Print (KEPT)
        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE ACTIVE");
        System.out.println("Mapping URL: /api/" + dirName + "/**");
        System.out.println("To Physical Path: " + uploadPath);
        System.out.println("=================================================");
    }
}