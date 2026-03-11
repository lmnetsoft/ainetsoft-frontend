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
        // 1. Define the folder name
        String dirName = "uploads";
        
        // 2. Get the absolute path of the 'uploads' folder relative to project root
        Path uploadDir = Paths.get(dirName);
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        // 3. Register the handler
        // On Windows, absolute paths need an extra '/' (file:/C:/...)
        // This logic ensures it works everywhere.
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations("file:" + uploadPath);
    }
}