package com.shanu.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shanu.backend.client.GeminiClient;
import com.shanu.backend.model.Conversation;
import com.shanu.backend.model.Message;
import com.shanu.backend.model.Transaction;
import com.shanu.backend.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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

    @Autowired
    private TransactionService transactionService;
    
    @Value("${chat.system-prompt:You are BudgetPilot, a friendly financial advisor chatbot. Analyze the user's financial data comprehensively. Provide insights, suggestions, and alerts. Be conversational and helpful. You can respond with or without JSON - plain text is fine too.}")
    private String systemPrompt;
    
    @Value("${chat.rate-limit.per-sec:2}")
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
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) assistantData.get("options");
            assistantMessage.setOptions(options);
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
     * Build a comprehensive transaction context for the user.
     * Includes: total income, total expense, category breakdown, recent transactions, budget status.
     */
    private String buildTransactionContext(String userId) {
        List<Transaction> transactions = transactionService.getTransactionsByUser(userId);
        
        if (transactions == null || transactions.isEmpty()) {
            return "User has no transaction data yet.";
        }
        
        StringBuilder context = new StringBuilder();
        
        // Calculate totals
        double totalIncome = 0;
        double totalExpense = 0;
        
        for (Transaction txn : transactions) {
            if ("income".equalsIgnoreCase(txn.getType())) {
                totalIncome += txn.getAmount();
            } else if ("expense".equalsIgnoreCase(txn.getType())) {
                totalExpense += txn.getAmount();
            }
        }
        
        double netSavings = totalIncome - totalExpense;
        
        // Add summary
        context.append("FINANCIAL SUMMARY:\n");
        context.append(String.format("- Total Income: ₹%.2f\n", totalIncome));
        context.append(String.format("- Total Expense: ₹%.2f\n", totalExpense));
        context.append(String.format("- Net Savings: ₹%.2f\n", netSavings));
        context.append(String.format("- Savings Rate: %.1f%%\n", totalIncome > 0 ? (netSavings / totalIncome * 100) : 0));
        
        // Category breakdown for expenses
        Map<String, Double> categoryTotals = new HashMap<>();
        for (Transaction txn : transactions) {
            if ("expense".equalsIgnoreCase(txn.getType())) {
                String category = txn.getCategory() != null ? txn.getCategory() : "Uncategorized";
                categoryTotals.put(category, categoryTotals.getOrDefault(category, 0.0) + txn.getAmount());
            }
        }
        
        // Sort by amount (descending)
        List<Map.Entry<String, Double>> sortedCategories = categoryTotals.entrySet().stream()
            .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
            .collect(Collectors.toList());
        
        if (!sortedCategories.isEmpty()) {
            context.append("\nEXPENSE BY CATEGORY (Top):\n");
            int count = 0;
            for (Map.Entry<String, Double> entry : sortedCategories) {
                if (count >= 5) break; // Top 5 categories
                double percentage = (entry.getValue() / totalExpense) * 100;
                context.append(String.format("- %s: ₹%.2f (%.1f%%)\n", entry.getKey(), entry.getValue(), percentage));
                count++;
            }
        }
        
        // Recent transactions (last 5)
        List<Transaction> recentTxns = transactions.stream()
                .sorted((a, b) -> {
                    java.util.Date dateA = a.getDate() != null ? a.getDate() : new java.util.Date(0);
                    java.util.Date dateB = b.getDate() != null ? b.getDate() : new java.util.Date(0);
                return dateB.compareTo(dateA);
            })
            .limit(5)
            .collect(Collectors.toList());
        
        if (!recentTxns.isEmpty()) {
            context.append("\nRECENT TRANSACTIONS:\n");
            for (Transaction txn : recentTxns) {
                String type = txn.getType() != null ? txn.getType().toUpperCase() : "UNKNOWN";
                String category = txn.getCategory() != null ? txn.getCategory() : "Uncategorized";
                String description = txn.getDescription() != null ? txn.getDescription() : "(no description)";
                context.append(String.format("- [%s] %s: ₹%.2f - %s\n", type, category, txn.getAmount(), description));
            }
        }
        
        context.append("\n");
        return context.toString();
    }

    /**
     * Handle a user message in an existing conversation.
     * Validates ownership, appends message, calls Gemini with transaction context, parses response, saves.
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
        
        // Append user message (prefer text, fallback to option)
        String userText = text != null && !text.isEmpty() ? text : (option != null ? option : "");
        if (userText.isEmpty()) {
            throw new IllegalArgumentException("Either 'text' or 'option' must be provided");
        }
        
        Message userMessage = new Message("user", userText);
        conversation.getMessages().add(userMessage);
        
        // Build prompt with transaction context
        StringBuilder prompt = new StringBuilder(systemPrompt);
        prompt.append("\n\n=== USER'S FINANCIAL DATA ===\n");
        
        // Get and include transaction context
        String transactionContext = buildTransactionContext(userId);
        prompt.append(transactionContext);
        
        prompt.append("\n=== CONVERSATION HISTORY ===\n");
        
        // Include last 15 messages for context
        int startIdx = Math.max(0, conversation.getMessages().size() - 15);
        for (int i = startIdx; i < conversation.getMessages().size(); i++) {
            Message msg = conversation.getMessages().get(i);
            prompt.append(msg.getRole().toUpperCase()).append(": ").append(msg.getText()).append("\n");
        }
        
        // Call Gemini with full context
        Map<String, Object> assistantData;
        String geminiResponse;
        try {
            geminiResponse = geminiClient.callGemini(prompt.toString());
            // Parse response (both JSON and plain text supported)
            assistantData = parseGeminiResponse(geminiResponse);
        } catch (Exception e) {
            // On failure, prepare a helpful assistant message containing the error
            String errText = "Error contacting Gemini: " + e.getMessage();
            Message errorAssistant = new Message("assistant", "❌ " + errText + "\n\nPlease try again later.");
            Map<String, Object> meta = new HashMap<>();
            meta.put("source", "gemini");
            meta.put("error", e.getMessage());
            errorAssistant.setMetadata(meta);
            conversation.getMessages().add(errorAssistant);
            conversation.setUpdatedAt(LocalDateTime.now());
            if (conversation.getMeta() == null) conversation.setMeta(new HashMap<>());
            conversation.getMeta().put("last_error", e.getMessage());
            conversationRepository.save(conversation);

            Map<String, Object> response = new HashMap<>();
            response.put("assistantMessage", errorAssistant);
            response.put("conversation", conversation);
            return response;
        }

        Message assistantMessage = new Message("assistant", 
            (String) (assistantData != null ? assistantData.getOrDefault("text", "I understand. How can I assist further?") : "I understand. How can I assist further?"));

        if (assistantData != null && assistantData.containsKey("options")) {
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) assistantData.get("options");
            assistantMessage.setOptions(options);
        }

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("source", "gemini");
        assistantMessage.setMetadata(metadata);
        
        conversation.getMessages().add(assistantMessage);
        conversation.setUpdatedAt(LocalDateTime.now());
        
        // Update meta state
        if (conversation.getMeta() == null) {
            conversation.setMeta(new HashMap<>());
        }
        conversation.getMeta().put("last_updated", LocalDateTime.now().toString());
        
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
