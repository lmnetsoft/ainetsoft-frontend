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
        File licenseFolder = new File(dirName + "/license");
        File systemFolder = new File(dirName + "/system");
        
        // 🚀 NEW: Specifically for the Footer/Help menu icons
        File menuFolder = new File(dirName + "/system/menus"); 

        if (!uploadFolder.exists()) uploadFolder.mkdirs();
        if (!cccdFolder.exists()) cccdFolder.mkdirs();
        if (!adsFolder.exists()) adsFolder.mkdirs();
        if (!licenseFolder.exists()) licenseFolder.mkdirs();
        if (!systemFolder.exists()) systemFolder.mkdirs();
        if (!menuFolder.exists()) menuFolder.mkdirs(); // 🚀 Ensure menus folder exists!

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        String uploadPath = "file:" + uploadDir.toString() + File.separator;

        /**
         * 2. REGISTER THE MAPPINGS
         * The /** mapping means all sub-folders (cccd, ads, system/menus) 
         * are automatically served via these URLs.
         */
        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);

        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);

        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE UPDATED");
        System.out.println("Base Path: " + uploadPath);
        System.out.println("Serving: /api/uploads/system/menus/**");
        System.out.println("=================================================");
    }
}