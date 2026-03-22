package com.ainetsoft.repository;

import com.ainetsoft.model.ShippingMethod;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShippingMethodRepository extends MongoRepository<ShippingMethod, String> {
    
    /**
     * Required by the ShippingMethodController.
     * This allows MongoDB to filter active methods automatically.
     */
    List<ShippingMethod> findAllByActiveTrue();
}