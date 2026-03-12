package com.ainetsoft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@SpringBootApplication
public class AinetsoftApplication {

    public static void main(String[] args) {
        SpringApplication.run(AinetsoftApplication.class, args);
    }

    @Configuration
    public static class WebConfig implements WebMvcConfigurer {
        @Override
        public void addResourceHandlers(ResourceHandlerRegistry registry) {
            // 1. Get the absolute path to your local "uploads" folder
            // This ensures the backend knows exactly where the files are on your disk
            String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();
            
            // 2. Map the web URL path (/uploads/**) to the physical disk location
            // This allows the browser to stream videos natively using "Byte Range Requests"
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(uploadPath);
            
            // Logging for your verification during startup
            System.out.println("=================================================");
            System.out.println("CHAT STORAGE SYSTEM ACTIVE");
            System.out.println("Access URL: http://localhost:8080/uploads/...");
            System.out.println("Physical Path: " + uploadPath);
            System.out.println("=================================================");
        }
    }
}