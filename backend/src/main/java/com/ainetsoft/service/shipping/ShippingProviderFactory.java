package com.ainetsoft.service.shipping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ShippingProviderFactory {
    private final Map<String, ShippingProvider> providers = new HashMap<>();

    @Autowired
    public ShippingProviderFactory(List<ShippingProvider> providerList) {
        for (ShippingProvider provider : providerList) {
            providers.put(provider.getProviderCode(), provider);
        }
    }

    public ShippingProvider getProvider(String code) {
        ShippingProvider provider = providers.get(code);
        if (provider == null) {
            throw new RuntimeException("Hệ thống chưa hỗ trợ đơn vị vận chuyển: " + code);
        }
        return provider;
    }
}
