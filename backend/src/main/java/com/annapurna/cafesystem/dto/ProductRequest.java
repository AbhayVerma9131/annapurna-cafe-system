package com.annapurna.cafesystem.dto;

import lombok.Data;

@Data
public class ProductRequest {
    private String name;
    private String description;
    private Double price;
    private Long categoryId;
    private boolean isAvailable;
    private Integer initialStock;
}
