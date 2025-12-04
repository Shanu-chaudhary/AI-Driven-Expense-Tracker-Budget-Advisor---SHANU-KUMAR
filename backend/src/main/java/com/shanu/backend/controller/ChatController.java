package com.shanu.backend.controller;

import com.shanu.backend.model.Conversation;
import com.shanu.backend.service.AuthService;
import com.shanu.backend.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Chat Controller for BudgetPilot chatbot.
 * 
 * Endpoints:
 * - POST /api/chat/start: Create new conversation
 * - GET /api/chat/{id}: Fetch conversation
 * - POST /api/chat/{id}/message: Send user message
 * - GET /api/chat: List user's conversations
 * 
 * All endpoints require Authorization header with Bearer token.
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
public class ChatController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private com.shanu.backend.client.GeminiClient geminiClient;
    
    @Autowired
    private AuthService authService;

    /**
     * POST /api/chat/start
     * 
     * Start a new conversation.
     * 
     * Response:
     * {
     *   "conversationId": "...",
     *   "assistantMessage": { "text": "...", "options": [...], "role": "assistant", "timestamp": "..." }
     * }
     */
    @PostMapping("/start")
    public ResponseEntity<?> startConversation(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            String userId = authService.getUserFromToken(token.substring(7)).getId();
            Conversation conversation = chatService.startConversation(userId);
            
            Map<String, Object> response = Map.of(
                "conversationId", conversation.getId(),
                "assistantMessage", conversation.getMessages().get(0)
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/chat/{id}
     * 
     * Fetch a conversation by ID (ownership validated).
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getConversation(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            String userId = authService.getUserFromToken(token.substring(7)).getId();
            Conversation conversation = chatService.fetchConversation(id, userId);
            
            return ResponseEntity.ok(conversation);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(404).body(Map.of("error", iae.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * POST /api/chat/{id}/message
     * 
     * Send a user message to the chatbot.
     * 
     * Body:
     * {
     *   "text": "I want help with savings",  // optional
     *   "option": "Savings Plan"            // optional
     * }
     * 
     * At least one of 'text' or 'option' must be provided.
     * 
     * Response:
     * {
     *   "assistantMessage": { "text": "...", "options": [...], "metadata": {...} },
     *   "conversation": { ... full conversation ... }
     * }
     */
    @PostMapping("/{id}/message")
    public ResponseEntity<?> sendMessage(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestBody Map<String, String> body) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            String userId = authService.getUserFromToken(token.substring(7)).getId();
            String text = body.getOrDefault("text", null);
            String option = body.getOrDefault("option", null);
            
            Map<String, Object> response = chatService.handleUserMessage(id, userId, text, option);
            
            return ResponseEntity.ok(response);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(Map.of("error", se.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(400).body(Map.of("error", iae.getMessage()));
        } catch (RuntimeException re) {
            // Rate limit exceeded
            if (re.getMessage().contains("Rate limit")) {
                return ResponseEntity.status(429).body(Map.of("error", re.getMessage()));
            }
            return ResponseEntity.status(500).body(Map.of("error", re.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * GET /api/chat
     * 
     * List all conversations for the authenticated user.
     * 
     * Response: [{ "id": "...", "title": "...", "updatedAt": "..." }, ...]
     */
    @GetMapping
    public ResponseEntity<?> listConversations(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
            }
            
            String userId = authService.getUserFromToken(token.substring(7)).getId();
            List<Conversation> conversations = chatService.listUserConversations(userId);
            
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * DEBUG: Call Gemini directly to reproduce API errors without authentication.
     * POST /api/chat/debug/gemini
     * Body: { "prompt": "..." } (optional)
     */
    @PostMapping("/debug/gemini")
    public ResponseEntity<?> debugGemini(@RequestBody(required = false) Map<String, String> body) {
        try {
            String prompt = (body != null && body.containsKey("prompt")) ? body.get("prompt") : "Debug ping from server";
            String resp = geminiClient.callGemini(prompt);
            return ResponseEntity.ok(Map.of("response", resp));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage(), "exception", e.toString()));
        }
    }
}
