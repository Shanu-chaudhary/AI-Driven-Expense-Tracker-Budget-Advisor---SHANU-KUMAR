package com.shanu.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin(origins = "http://localhost:5173")
public class BackupController {

    // No auth service required for basic local backup endpoint (keeps implementation simple)

    @PostMapping("/upload")
    public ResponseEntity<?> uploadBackup(@RequestHeader(value = "Authorization", required = false) String token,
                                          @RequestParam("provider") String provider,
                                          @RequestParam("file") MultipartFile file,
                                          @RequestParam(value = "oauth_token", required = false) String oauthToken) {
        try {
            // Basic saving to local server as backup
            String name = "backup_" + Instant.now().toString().replaceAll(":","-") + "_" + file.getOriginalFilename();
            File out = new File(System.getProperty("java.io.tmpdir"), name);
            try (FileOutputStream fos = new FileOutputStream(out)) {
                fos.write(file.getBytes());
            }

            // If provider is cloud and oauthToken provided, we would integrate here.
            if (("drive".equalsIgnoreCase(provider) || "dropbox".equalsIgnoreCase(provider))) {
                if (oauthToken == null || oauthToken.isBlank()) {
                    return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(Map.of("message","Cloud upload requires OAuth token; not implemented in dev mode","savedFile", out.getAbsolutePath()));
                }
                // Placeholder: real cloud upload code should be added here with provider SDK and server-side credentials.
                return ResponseEntity.ok(Map.of("message","Cloud upload simulated (token accepted)", "savedFile", out.getAbsolutePath()));
            }

            return ResponseEntity.ok(Map.of("message","Backup saved locally","savedFile", out.getAbsolutePath()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
