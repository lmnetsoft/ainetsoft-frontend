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
        
        // BITNAMILEGACY FIX: Ensure both base and cccd subfolders exist to avoid mapping errors
        File uploadFolder = new File(dirName);
        File cccdFolder = new File(dirName + "/cccd");
        
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
        if (!cccdFolder.exists()) {
            cccdFolder.mkdirs();
        }

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        
        // 2. Convert to URI string (file:/...)
        String uploadPath = uploadDir.toUri().toString();

        // 3. Trailing slash check
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        /**
         * 4. Register the mapping
         * This maps 'http://localhost:8080/api/uploads/...' to the physical folder.
         * Note: I added '/api/' prefix to the handler to match the standard API routing 
         * and the return path in AuthService.
         */
        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600) 
                .resourceChain(true);

        // 5. Debug Print
        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE ACTIVE");
        System.out.println("Mapping URL: /api/" + dirName + "/**");
        System.out.println("To Physical Path: " + uploadPath);
        System.out.println("=================================================");
    }
}