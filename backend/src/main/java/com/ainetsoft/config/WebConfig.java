package com.ainetsoft.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 1. Target the 'uploads' folder relative to the project root
        String dirName = "uploads";
        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        
        // 2. Convert to URI string (results in something like file:/mnt/d/path/to/uploads/)
        String uploadPath = uploadDir.toUri().toString();

        // 3. Ensure the location string ends with a slash
        // Spring requires the trailing slash for directory locations to work correctly
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        // 4. Register the mapping
        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600) // Optional: Cache images for 1 hour to improve performance
                .resourceChain(true);

        // 5. Debug Print - Check your console when the app starts!
        System.out.println("=================================================");
        System.out.println("CHAT STORAGE SYSTEM");
        System.out.println("Mapping URL: /" + dirName + "/**");
        System.out.println("To Physical Path: " + uploadPath);
        System.out.println("=================================================");
    }
}