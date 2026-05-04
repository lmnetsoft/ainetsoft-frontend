package com.ainetsoft.repository;

import com.ainetsoft.model.PlatformConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlatformConfigRepository extends MongoRepository<PlatformConfig, String> {
}