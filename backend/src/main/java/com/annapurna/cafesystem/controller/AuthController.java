package com.annapurna.cafesystem.controller;

import com.annapurna.cafesystem.dto.JwtResponse;
import com.annapurna.cafesystem.dto.LoginRequest;
import com.annapurna.cafesystem.entity.User;
import com.annapurna.cafesystem.repository.UserRepository;
import com.annapurna.cafesystem.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (encoder.matches(loginRequest.getPassword(), user.getPassword())) {
                String jwt = jwtUtils.generateJwtToken(user.getUsername(), user.getRole().name());
                return ResponseEntity.ok(new JwtResponse(jwt, user.getUsername(), user.getRole().name(), user.isForcePasswordChange()));
            }
        }
        return ResponseEntity.status(401).body("Error: Unauthorized");
    }
}
