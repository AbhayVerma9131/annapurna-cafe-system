package com.annapurna.cafesystem.repository;

import com.annapurna.cafesystem.entity.CafeOrder;
import com.annapurna.cafesystem.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CafeOrderRepository extends JpaRepository<CafeOrder, Long> {
    Optional<CafeOrder> findByOrderNumber(String orderNumber);
    List<CafeOrder> findByStatus(OrderStatus status);
    List<CafeOrder> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
