package com.restaurant.ai.controller;

import com.restaurant.ai.ai.ChatResult;
import com.restaurant.ai.ai.GeminiService;
import com.restaurant.ai.ai.tool.ToolExecutionContext;
import com.restaurant.ai.config.RestaurantProperties;
import com.restaurant.ai.dto.AiChatRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * TEST-ONLY endpoint for exercising the full AI -> tool -> database -> Gemini
 * loop without needing WhatsApp wired up (Phase 9/10). Not authenticated
 * beyond the placeholder SecurityConfig, and not meant for production
 * traffic - the real path is Webhook -> ConversationService -> GeminiService.
 */
@RestController
@RequestMapping("/api/ai")
public class AiTestController {

    private final GeminiService geminiService;
    private final RestaurantProperties restaurantProperties;

    public AiTestController(GeminiService geminiService, RestaurantProperties restaurantProperties) {
        this.geminiService = geminiService;
        this.restaurantProperties = restaurantProperties;
    }

    @PostMapping("/chat")
    public ChatResult chat(@Valid @RequestBody AiChatRequest request) {
        ToolExecutionContext context = new ToolExecutionContext(
                restaurantProperties.getDefaultId(),
                null,
                null,
                UUID.randomUUID().toString()
        );
        List<com.restaurant.ai.ai.ConversationTurn> history =
                request.history() == null ? List.of() : request.history();
        return geminiService.chat(context, history, request.message());
    }
}
