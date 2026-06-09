package com.annapurna.cafesystem.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cafe_tables")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CafeTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String tableNumber;

    @Column(nullable = true)
    private String qrCodePath;
}
