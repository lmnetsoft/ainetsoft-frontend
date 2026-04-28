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
        File menuFolder = new File(dirName + "/system/menus");
        
        // 🚀 THÊM MỚI 1: Khai báo thư mục chat
        File chatFolder = new File(dirName + "/chat");

        if (!uploadFolder.exists()) uploadFolder.mkdirs();
        if (!cccdFolder.exists()) cccdFolder.mkdirs();
        if (!adsFolder.exists()) adsFolder.mkdirs();
        if (!licenseFolder.exists()) licenseFolder.mkdirs();
        if (!systemFolder.exists()) systemFolder.mkdirs();
        if (!menuFolder.exists()) menuFolder.mkdirs();
        if (!chatFolder.exists()) chatFolder.mkdirs(); // 🚀 THÊM MỚI 1: Tự động tạo thư mục chat

        Path uploadDir = Paths.get(dirName).toAbsolutePath();
        String uploadPath = "file:" + uploadDir.toString() + File.separator;

        registry.addResourceHandler("/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);

        registry.addResourceHandler("/api/" + dirName + "/**")
                .addResourceLocations(uploadPath)
                .setCachePeriod(3600);

        // 🚀 THÊM MỚI 2: Ánh xạ URL tải ảnh/video chat thẳng vào thư mục trên ổ cứng.
        // Spring Boot sẽ TỰ ĐỘNG lo liệu Video Streaming (HTTP 206) cực mượt.
        Path chatDir = Paths.get(dirName, "chat").toAbsolutePath();
        String chatResourcePath = "file:" + chatDir.toString() + File.separator;
        
        registry.addResourceHandler("/api/chat/file/**")
                .addResourceLocations(chatResourcePath)
                .setCachePeriod(3600);

        System.out.println("=================================================");
        System.out.println("SYSTEM MEDIA STORAGE UPDATED");
        System.out.println("Base Path: " + uploadPath);
        System.out.println("Serving: /api/uploads/system/menus/**");
        System.out.println("Serving Chat: /api/chat/file/**"); // 🚀 Bổ sung log
        System.out.println("=================================================");
    }
}