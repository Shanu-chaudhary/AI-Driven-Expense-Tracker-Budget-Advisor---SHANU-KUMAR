package com.shanu.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shanu.backend.client.GeminiClient;
import com.shanu.backend.model.Conversation;
import com.shanu.backend.model.Message;
import com.shanu.backend.repository.ConversationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * ChatServiceTest - Unit tests for ChatService.
 * 
 * Tests cover:
 * - startConversation: creates new conversation, calls Gemini, saves to MongoDB
 * - handleUserMessage: appends user message, calls Gemini, parses JSON response
 * - parseGeminiResponse: extracts JSON from code-fenced blocks, fallback to plain text
 * - checkRateLimit: enforces per-user throttle (2 req/sec max)
 * 
 * Mocks: GeminiClient (API calls), ConversationRepository (database operations)
 */
@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

  @Mock private ConversationRepository conversationRepository;
  @Mock private GeminiClient geminiClient;
  @InjectMocks private ChatService chatService;
  private ObjectMapper objectMapper;

  @BeforeEach
  void setUp() {
    objectMapper = new ObjectMapper();
  }

  /**
   * Test: startConversation creates new conversation with greeting from Gemini.
   * Verifies: conversationId is set, message is saved, repository.save() called.
   */
  @Test
  void testStartConversation() {
    // Arrange
    String userId = "user-123";
    String geminiGreeting =
        "{\"response\": \"Hello! I'm BudgetPilot.\", \"options\": [\"Start Budget Review\", \"Check Expenses\"]}";

    when(geminiClient.callGemini(anyString())).thenReturn(geminiGreeting);
    when(conversationRepository.save(any(Conversation.class)))
        .thenAnswer(
            invocation -> {
              Conversation conv = invocation.getArgument(0);
              conv.setId("conv-123");
              return conv;
            });

    // Act
    Conversation result = chatService.startConversation(userId);

    // Assert
    assertNotNull(result);
    assertEquals(userId, result.getUserId());
    assertFalse(result.getMessages().isEmpty());
    assertEquals("assistant", result.getMessages().get(0).getRole());
    verify(geminiClient, times(1)).callGemini(anyString());
    verify(conversationRepository, times(1)).save(any(Conversation.class));
  }

  /**
   * Test: handleUserMessage appends user message and returns assistant response.
   * Verifies: user message appended, Gemini called, response parsed, conversation saved.
   */
  @Test
  void testHandleUserMessage() {
    // Arrange
    String conversationId = "conv-123";
    String userId = "user-123";
    String userText = "I want to save money";

    Conversation conversation = new Conversation();
    conversation.setId(conversationId);
    conversation.setUserId(userId);
    conversation.setMessages(List.of());

    String geminiResponse =
        "{\"response\": \"Great goal! How much do you want to save?\", \"options\": [\"$100/month\", \"$500/month\"]}";

    when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));
    when(geminiClient.callGemini(anyString())).thenReturn(geminiResponse);
    when(conversationRepository.save(any(Conversation.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    Message result = chatService.handleUserMessage(conversationId, userId, userText, false);

    // Assert
    assertNotNull(result);
    assertEquals("assistant", result.getRole());
    assertTrue(result.getText().contains("Great goal!"));
    verify(conversationRepository, times(1)).findById(conversationId);
    verify(geminiClient, times(1)).callGemini(anyString());
    verify(conversationRepository, times(1)).save(any(Conversation.class));
  }

  /**
   * Test: parseGeminiResponse extracts JSON from code-fenced blocks.
   * Verifies: ```json...``` block is parsed correctly.
   */
  @Test
  void testParseGeminiResponseCodeFenced() {
    // Arrange
    String geminiResponse =
        "Here's the analysis:\n```json\n{\"response\": \"Your spending is high\", \"options\": []}\n```";

    // Act
    Message result = chatService.parseGeminiResponse(geminiResponse);

    // Assert
    assertNotNull(result);
    assertEquals("assistant", result.getRole());
    assertTrue(result.getText().contains("spending"));
  }

  /**
   * Test: parseGeminiResponse falls back to plain text if JSON parsing fails.
   * Verifies: unparseable response still returns assistant message.
   */
  @Test
  void testParseGeminiResponseFallback() {
    // Arrange
    String plainTextResponse = "I couldn't parse that. Can you try again?";

    // Act
    Message result = chatService.parseGeminiResponse(plainTextResponse);

    // Assert
    assertNotNull(result);
    assertEquals("assistant", result.getRole());
    assertEquals(plainTextResponse, result.getText());
  }

  /**
   * Test: checkRateLimit enforces per-user throttle.
   * Verifies: first requests succeed, 3rd request within 1 sec is throttled.
   */
  @Test
  void testCheckRateLimitThrottle() throws InterruptedException {
    // Arrange
    String userId = "user-123";

    // Act & Assert - first two requests should succeed
    assertTrue(chatService.checkRateLimit(userId)); // 1st request
    assertTrue(chatService.checkRateLimit(userId)); // 2nd request

    // 3rd request within 1 second should fail (limit is 2/sec)
    assertFalse(chatService.checkRateLimit(userId)); // 3rd request throttled
  }

  /**
   * Test: fetchConversation retrieves conversation with ownership validation.
   * Verifies: correct conversation returned when userId matches.
   */
  @Test
  void testFetchConversation() {
    // Arrange
    String conversationId = "conv-123";
    String userId = "user-123";

    Conversation conversation = new Conversation();
    conversation.setId(conversationId);
    conversation.setUserId(userId);

    when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

    // Act
    Conversation result = chatService.fetchConversation(conversationId, userId);

    // Assert
    assertNotNull(result);
    assertEquals(conversationId, result.getId());
    verify(conversationRepository, times(1)).findById(conversationId);
  }

  /**
   * Test: fetchConversation throws exception on ownership mismatch.
   * Verifies: 403 Forbidden when userId doesn't match conversation owner.
   */
  @Test
  void testFetchConversationForbidden() {
    // Arrange
    String conversationId = "conv-123";
    String userId = "user-123";
    String otherUserId = "user-999";

    Conversation conversation = new Conversation();
    conversation.setId(conversationId);
    conversation.setUserId(userId);

    when(conversationRepository.findById(conversationId)).thenReturn(Optional.of(conversation));

    // Act & Assert
    assertThrows(
        SecurityException.class, () -> chatService.fetchConversation(conversationId, otherUserId));
  }

  /**
   * Test: listUserConversations returns all conversations for user.
   * Verifies: repository.findByUserIdOrderByUpdatedAtDesc() called and results returned.
   */
  @Test
  void testListUserConversations() {
    // Arrange
    String userId = "user-123";
    Conversation conv1 = new Conversation();
    conv1.setId("conv-1");
    conv1.setUserId(userId);
    Conversation conv2 = new Conversation();
    conv2.setId("conv-2");
    conv2.setUserId(userId);

    when(conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId))
        .thenReturn(List.of(conv1, conv2));

    // Act
    List<Conversation> result = chatService.listUserConversations(userId);

    // Assert
    assertNotNull(result);
    assertEquals(2, result.size());
    verify(conversationRepository, times(1)).findByUserIdOrderByUpdatedAtDesc(userId);
  }
}
