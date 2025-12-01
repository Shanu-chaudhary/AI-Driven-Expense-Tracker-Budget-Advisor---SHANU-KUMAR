package com.shanu.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shanu.backend.client.GeminiClient;
import com.shanu.backend.model.Conversation;
import com.shanu.backend.model.Message;
import com.shanu.backend.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ChatService orchestrates guided chatbot conversations.
 * 
 * Features:
 * - Starts new conversations with system prompt
 * - Handles user messages and routes to Gemini
 * - Parses JSON responses and extracts options
 * - Maintains conversation state (meta) for flow control
 * - Simple in-memory rate limiting (TODO: use Redis for production)
 * 
 * Environment variables:
 * - CHAT_SYSTEM_PROMPT: Custom system prompt (optional)
 * - CHAT_RATE_LIMIT_PER_SEC: Max requests per user per second (default 2)
 */
@Service
public class ChatService {
    
    @Autowired
    private ConversationRepository conversationRepository;
    
    @Autowired
    private GeminiClient geminiClient;
    
    @Value("${chat.system.prompt:You are BudgetPilot, a friendly financial advisor chatbot. Guide the user through a step-by-step journey to understand their financial goals. Ask 2-4 options at a time. Always respond with valid JSON containing: {\"text\": \"Your message\", \"options\": [\"Option 1\", \"Option 2\"], \"confidence\": 75}}")
    private String systemPrompt;
    
    @Value("${chat.rate.limit.per.sec:2}")
    private int rateLimitPerSec;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, Long> userRequestTimestamps = new ConcurrentHashMap<>();

    /**
     * Start a new conversation for a user.
     * Creates initial conversation with greeting message from assistant.
     */
    public Conversation startConversation(String userId) throws Exception {
        checkRateLimit(userId);
        
        Conversation conversation = new Conversation(userId, "Chat with BudgetPilot");
        conversation.setMessages(new ArrayList<>());
        conversation.setMeta(new HashMap<>());
        conversation.getMeta().put("step", "greeting");
        
        // Call Gemini for initial greeting
        String systemAndPrompt = systemPrompt + "\n\nUser is starting a new conversation. Greet them and ask what they need help with.";
        String geminiResponse = geminiClient.callGemini(systemAndPrompt);
        
        Map<String, Object> assistantData = parseGeminiResponse(geminiResponse);
        Message assistantMessage = new Message("assistant", 
            (String) assistantData.getOrDefault("text", "Hello! How can I help you today?"));
        
        if (assistantData.containsKey("options")) {
            assistantMessage.setOptions((List<String>) assistantData.get("options"));
        }
        if (assistantData.containsKey("confidence")) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("confidence", assistantData.get("confidence"));
            assistantMessage.setMetadata(meta);
        }
        
        conversation.getMessages().add(assistantMessage);
        return conversationRepository.save(conversation);
    }

    /**
     * Handle a user message in an existing conversation.
     * Validates ownership, appends message, calls Gemini, parses response, saves.
     */
    public Map<String, Object> handleUserMessage(String conversationId, String userId, String text, String option) throws Exception {
        checkRateLimit(userId);
        
        // Fetch conversation
        Optional<Conversation> convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isEmpty()) {
            throw new IllegalArgumentException("Conversation not found: " + conversationId);
        }
        
        Conversation conversation = convOpt.get();
        
        // Verify ownership
        if (!conversation.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized: conversation does not belong to user");
        }
        
        // Append user message (prefer option, fallback to text)
        String userText = option != null ? "Selected: " + option : (text != null ? text : "");
        if (userText.isEmpty()) {
            throw new IllegalArgumentException("Either 'text' or 'option' must be provided");
        }
        
        Message userMessage = new Message("user", userText);
        conversation.getMessages().add(userMessage);
        
        // Build prompt from conversation history
        StringBuilder prompt = new StringBuilder(systemPrompt);
        prompt.append("\n\n--- Conversation History ---\n");
        
        // Include last 10 messages for context
        int startIdx = Math.max(0, conversation.getMessages().size() - 10);
        for (int i = startIdx; i < conversation.getMessages().size(); i++) {
            Message msg = conversation.getMessages().get(i);
            prompt.append(msg.getRole().toUpperCase()).append(": ").append(msg.getText()).append("\n");
        }
        
        // Add meta state if relevant
        if (conversation.getMeta() != null && !conversation.getMeta().isEmpty()) {
            prompt.append("\n--- Current State ---\n");
            conversation.getMeta().forEach((key, value) -> 
                prompt.append(key).append(": ").append(value).append("\n")
            );
        }
        
        // Call Gemini
        String geminiResponse = geminiClient.callGemini(prompt.toString());
        
        // Parse response
        Map<String, Object> assistantData = parseGeminiResponse(geminiResponse);
        
        Message assistantMessage = new Message("assistant", 
            (String) assistantData.getOrDefault("text", "I understand. How can I assist further?"));
        
        if (assistantData.containsKey("options")) {
            assistantMessage.setOptions((List<String>) assistantData.get("options"));
        }
        
        Map<String, Object> metadata = new HashMap<>();
        if (assistantData.containsKey("confidence")) {
            metadata.put("confidence", assistantData.get("confidence"));
        }
        metadata.put("source", "gemini");
        assistantMessage.setMetadata(metadata);
        
        conversation.getMessages().add(assistantMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        
        // Update meta state
        if (conversation.getMeta() == null) {
            conversation.setMeta(new HashMap<>());
        }
        conversation.getMeta().put("last_step", assistantData.getOrDefault("step", "processing"));
        
        conversationRepository.save(conversation);
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("assistantMessage", assistantMessage);
        response.put("conversation", conversation);
        
        return response;
    }

    /**
     * Fetch a conversation by ID (ownership validated by caller).
     */
    public Conversation fetchConversation(String conversationId, String userId) {
        Optional<Conversation> convOpt = conversationRepository.findById(conversationId);
        if (convOpt.isEmpty()) {
            throw new IllegalArgumentException("Conversation not found");
        }
        
        Conversation conversation = convOpt.get();
        if (!conversation.getUserId().equals(userId)) {
            throw new SecurityException("Unauthorized");
        }
        
        return conversation;
    }

    /**
     * List conversations for a user.
     */
    public List<Conversation> listUserConversations(String userId) {
        return conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    /**
     * Parse Gemini JSON response.
     * Attempts to extract JSON from code-fenced blocks first, then parse directly.
     * Falls back to plain text if JSON parsing fails.
     */
    private Map<String, Object> parseGeminiResponse(String response) {
        Map<String, Object> result = new HashMap<>();
        
        // Try to extract JSON from code-fenced block (```json ... ```)
        Pattern jsonBlockPattern = Pattern.compile("```json\\s*([\\s\\S]*?)```");
        Matcher matcher = jsonBlockPattern.matcher(response);
        
        String jsonToParse = response;
        if (matcher.find()) {
            jsonToParse = matcher.group(1).trim();
        }
        
        try {
            JsonNode node = objectMapper.readTree(jsonToParse);
            
            // Extract text
            if (node.has("text")) {
                result.put("text", node.get("text").asText());
            }
            
            // Extract options if present
            if (node.has("options") && node.get("options").isArray()) {
                List<String> options = new ArrayList<>();
                node.get("options").forEach(opt -> options.add(opt.asText()));
                result.put("options", options);
            }
            
            // Extract confidence if present
            if (node.has("confidence")) {
                result.put("confidence", node.get("confidence").asInt());
            }
            
            // Extract step if present
            if (node.has("step")) {
                result.put("step", node.get("step").asText());
            }
            
            return result;
        } catch (Exception e) {
            // Fallback: return plain text response
            result.put("text", response);
            result.put("confidence", 50);
            return result;
        }
    }

    /**
     * Simple in-memory rate limiting.
     * Allows max 'rateLimitPerSec' requests per user per second.
     * 
     * TODO: For production, use Redis with sliding window counter.
     */
    private void checkRateLimit(String userId) throws RuntimeException {
        long now = System.currentTimeMillis();
        long oneSecondAgo = now - 1000;
        
        // Remove old timestamps
        userRequestTimestamps.entrySet().removeIf(entry -> entry.getValue() < oneSecondAgo);
        
        // Count requests in last second
        String key = userId + "_" + (now / 1000);
        long count = userRequestTimestamps.values().stream()
            .filter(ts -> ts >= oneSecondAgo)
            .count();
        
        if (count >= rateLimitPerSec) {
            throw new RuntimeException("Rate limit exceeded: max " + rateLimitPerSec + " requests per second");
        }
        
        userRequestTimestamps.put(key, now);
    }
}
