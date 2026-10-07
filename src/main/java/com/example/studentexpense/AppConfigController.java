package com.example.studentexpense;

import java.time.Duration;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

@RestController
public class AppConfigController {

    @Value("${app.password:}")
    private String appPassword;

    @GetMapping("/api/app/config")
    public Map<String, Object> config() {
        boolean passwordRequired = appPassword != null && !appPassword.isBlank();
        return Map.of(
                "passwordRequired", passwordRequired,
                "passwordSet", passwordRequired
        );
    }

    @PostMapping("/api/app/auth")
    public ResponseEntity<Map<String, Object>> auth(
            @RequestBody Map<String, String> payload,
            HttpServletRequest request) {
        String incomingPassword = payload == null ? "" : payload.getOrDefault("password", "");

        if (appPassword == null || appPassword.isBlank()) {
            return ResponseEntity.ok(Map.of("ok", true));
        }

        if (!Objects.equals(appPassword, incomingPassword)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("ok", false, "message", "Invalid password."));
        }

        boolean secure = "https".equalsIgnoreCase(request.getScheme());

        ResponseCookie cookie = ResponseCookie.from("expense_tracker_auth", "1")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(7))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("ok", true));
    }
}
