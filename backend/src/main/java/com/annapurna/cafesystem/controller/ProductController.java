package com.annapurna.cafesystem.controller;

import com.annapurna.cafesystem.dto.ProductRequest;
import com.annapurna.cafesystem.entity.Category;
import com.annapurna.cafesystem.entity.Inventory;
import com.annapurna.cafesystem.entity.Product;
import com.annapurna.cafesystem.repository.CategoryRepository;
import com.annapurna.cafesystem.repository.InventoryRepository;
import com.annapurna.cafesystem.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Value("${upload.dir}")
    private String uploadDir;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody ProductRequest request) {
        Optional<Category> category = categoryRepository.findById(request.getCategoryId());
        if (category.isEmpty()) {
            return ResponseEntity.badRequest().body("Category not found");
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(category.get())
                .isAvailable(request.isAvailable())
                .build();

        Product savedProduct = productRepository.save(product);

        // Initialize Inventory
        Inventory inventory = Inventory.builder()
                .product(savedProduct)
                .stockQuantity(request.getInitialStock() != null ? request.getInitialStock() : 0)
                .status((request.getInitialStock() != null && request.getInitialStock() > 0) ? Inventory.InventoryStatus.IN_STOCK : Inventory.InventoryStatus.OUT_OF_STOCK)
                .build();
        inventoryRepository.save(inventory);

        return ResponseEntity.ok(savedProduct);
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) return ResponseEntity.notFound().build();

        if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            Product product = productOpt.get();
            product.setImagePath(filename);
            productRepository.save(product);

            return ResponseEntity.ok("Image uploaded successfully: " + filename);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Could not store file: " + e.getMessage());
        }
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path file = Paths.get(uploadDir).resolve(filename);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG) // Simple generic fallback
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        if (productRepository.existsById(id)) {
            // First delete associated inventory and order items if necessary,
            // or rely on cascading deletes if configured. 
            // For this simple system, we just delete the inventory and product.
            inventoryRepository.findByProductId(id).ifPresent(inv -> inventoryRepository.delete(inv));
            productRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
