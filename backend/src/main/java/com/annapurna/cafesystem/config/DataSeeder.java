package com.annapurna.cafesystem.config;

import com.annapurna.cafesystem.entity.Role;
import com.annapurna.cafesystem.entity.User;
import com.annapurna.cafesystem.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByUsername("Annpurna").isEmpty()) {
                User admin = User.builder()
                        .username("Annpurna")
                        .password(passwordEncoder.encode("Arun@9755"))
                        .role(Role.ADMIN)
                        .forcePasswordChange(false)
                        .build();
                userRepository.save(admin);
                System.out.println("Admin user created: Annpurna / Arun@9755");
            }
        };
    }
}
