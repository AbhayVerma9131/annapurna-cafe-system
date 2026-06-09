package com.annapurna.cafesystem.repository;

import com.annapurna.cafesystem.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Long> {
    Optional<CafeTable> findByTableNumber(String tableNumber);
}
