package com.annapurna.cafesystem.dto;

import lombok.Data;
import java.util.List;

@Data
public class OrderRequest {
    private String customerName;
    private String mobileNumber;
    private Long tableId;
    private List<OrderItemRequest> items;

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
        private String specialNotes;
    }
}
