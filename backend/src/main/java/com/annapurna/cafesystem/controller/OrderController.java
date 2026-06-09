package com.annapurna.cafesystem.controller;

import com.annapurna.cafesystem.dto.OrderRequest;
import com.annapurna.cafesystem.entity.*;
import com.annapurna.cafesystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private CafeOrderRepository orderRepository;

    @Autowired
    private CafeTableRepository tableRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<CafeOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        CafeTable table = null;
        if (request.getTableId() != null) {
            table = tableRepository.findById(request.getTableId()).orElse(null);
        }
        
        if (table == null) {
            // Default to "Counter/Takeaway" table if none specified
            table = tableRepository.findByTableNumber("Counter").orElseGet(() -> {
                CafeTable t = new CafeTable();
                t.setTableNumber("Counter");
                t.setQrCodePath("");
                return tableRepository.save(t);
            });
        }

        CafeOrder order = CafeOrder.builder()
                .orderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customerName(request.getCustomerName())
                .mobileNumber(request.getMobileNumber())
                .table(table)
                .status(OrderStatus.RECEIVED)
                .createdAt(LocalDateTime.now())
                .totalAmount(0.0)
                .build();

        CafeOrder savedOrder = orderRepository.save(order);
        double total = 0;
        List<OrderItem> items = new ArrayList<>();

        for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId()).orElse(null);
            if (product != null) {
                OrderItem orderItem = OrderItem.builder()
                        .order(savedOrder)
                        .product(product)
                        .quantity(itemReq.getQuantity())
                        .priceAtTime(product.getPrice())
                        .specialNotes(itemReq.getSpecialNotes())
                        .build();
                items.add(orderItemRepository.save(orderItem));
                total += (product.getPrice() * itemReq.getQuantity());
            }
        }

        savedOrder.setTotalAmount(total);
        savedOrder.setOrderItems(items);
        orderRepository.save(savedOrder);

        // Broadcast to admin/kitchen
        messagingTemplate.convertAndSend("/topic/orders", savedOrder);

        return ResponseEntity.ok(savedOrder);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            CafeOrder updated = orderRepository.save(order);
            
            // Broadcast to admin/kitchen
            messagingTemplate.convertAndSend("/topic/orders", updated);
            // Broadcast to specific table for customer tracking
            messagingTemplate.convertAndSend("/topic/orders/" + order.getTable().getId(), updated);
            
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}
