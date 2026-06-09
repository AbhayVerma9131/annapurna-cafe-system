package com.annapurna.cafesystem.controller;

import com.annapurna.cafesystem.entity.Bill;
import com.annapurna.cafesystem.entity.CafeOrder;
import com.annapurna.cafesystem.repository.BillRepository;
import com.annapurna.cafesystem.repository.CafeOrderRepository;
import com.annapurna.cafesystem.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bills")
public class BillController {

    @Autowired
    private CafeOrderRepository orderRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillService billService;

    @Value("${upload.dir}")
    private String uploadDir;

    @PostMapping("/generate/{orderId}")
    public ResponseEntity<?> generateBill(@PathVariable Long orderId) {
        Optional<CafeOrder> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return ResponseEntity.notFound().build();

        Optional<Bill> existingBill = billRepository.findByOrderId(orderId);
        if (existingBill.isPresent()) {
            return ResponseEntity.ok(existingBill.get());
        }

        try {
            Bill bill = billService.generatePdfBill(orderOpt.get());
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to generate bill: " + e.getMessage());
        }
    }

    @GetMapping("/download/{billId}")
    public ResponseEntity<Resource> downloadBill(@PathVariable Long billId) {
        Optional<Bill> billOpt = billRepository.findById(billId);
        if (billOpt.isEmpty()) return ResponseEntity.notFound().build();

        try {
            Path file = Paths.get(uploadDir, "bills").resolve(billOpt.get().getPdfPath());
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_PDF)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
