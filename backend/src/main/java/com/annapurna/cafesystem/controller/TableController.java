package com.annapurna.cafesystem.controller;

import com.annapurna.cafesystem.entity.CafeTable;
import com.annapurna.cafesystem.repository.CafeTableRepository;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/tables")
public class TableController {

    @Autowired
    private CafeTableRepository tableRepository;

    @Value("${upload.dir}")
    private String uploadDir;

    @GetMapping
    public List<CafeTable> getAllTables() {
        return tableRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createTable(@RequestParam String tableNumber) {
        if (tableRepository.findByTableNumber(tableNumber).isPresent()) {
            return ResponseEntity.badRequest().body("Table already exists");
        }

        CafeTable table = new CafeTable();
        table.setTableNumber(tableNumber);
        
        CafeTable savedTable = tableRepository.save(table);

        try {
            // Generate QR Code pointing to the frontend menu
            String frontendUrl = "http://localhost:3000/menu?table=" + savedTable.getId();
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(frontendUrl, BarcodeFormat.QR_CODE, 300, 300);

            Path qrPath = Paths.get(uploadDir, "qr");
            if (!Files.exists(qrPath)) {
                Files.createDirectories(qrPath);
            }

            String qrFileName = "table_" + savedTable.getId() + ".png";
            Path filePath = qrPath.resolve(qrFileName);
            MatrixToImageWriter.writeToPath(bitMatrix, "PNG", filePath);

            savedTable.setQrCodePath(qrFileName);
            tableRepository.save(savedTable);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating QR code: " + e.getMessage());
        }

        return ResponseEntity.ok(savedTable);
    }

    @GetMapping("/qr/{filename:.+}")
    public ResponseEntity<Resource> getQrCode(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir, "qr").resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_PNG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
