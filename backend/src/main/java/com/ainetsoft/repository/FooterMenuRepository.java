package com.ainetsoft.repository;

import com.ainetsoft.model.FooterMenu;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FooterMenuRepository extends MongoRepository<FooterMenu, String> {
    List<FooterMenu> findAllByOrderByDisplayOrderAsc();
}