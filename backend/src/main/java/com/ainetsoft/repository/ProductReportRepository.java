package com.ainetsoft.repository;

import com.ainetsoft.model.ProductReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductReportRepository extends MongoRepository<ProductReport, String> {
}