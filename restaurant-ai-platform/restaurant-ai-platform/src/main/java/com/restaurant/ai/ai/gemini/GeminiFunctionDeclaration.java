package com.restaurant.ai.ai.gemini;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * A single tool's schema, in Gemini's functionDeclarations format.
 * "parameters" follows a subset of OpenAPI/JSON-Schema: type OBJECT with
 * named properties, each with its own type/description, plus a required list.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GeminiFunctionDeclaration(
        String name,
        String description,
        Map<String, Object> parameters
) {

    /** Convenience builder for a simple flat-object parameter schema. */
    public static GeminiFunctionDeclaration of(String name, String description,
                                                Map<String, GeminiPropertySchema> properties,
                                                List<String> required) {
        Map<String, Object> propsAsMap = new java.util.LinkedHashMap<>();
        properties.forEach((k, v) -> propsAsMap.put(k, v.toSchemaMap()));

        Map<String, Object> parameters = new java.util.LinkedHashMap<>();
        parameters.put("type", "OBJECT");
        parameters.put("properties", propsAsMap);
        if (required != null && !required.isEmpty()) {
            parameters.put("required", required);
        }
        return new GeminiFunctionDeclaration(name, description, parameters);
    }

    public record GeminiPropertySchema(String type, String description, List<String> enumValues) {

        public static GeminiPropertySchema string(String description) {
            return new GeminiPropertySchema("STRING", description, null);
        }

        public static GeminiPropertySchema stringEnum(String description, List<String> values) {
            return new GeminiPropertySchema("STRING", description, values);
        }

        public static GeminiPropertySchema number(String description) {
            return new GeminiPropertySchema("NUMBER", description, null);
        }

        public static GeminiPropertySchema integer(String description) {
            return new GeminiPropertySchema("INTEGER", description, null);
        }

        public static GeminiPropertySchema bool(String description) {
            return new GeminiPropertySchema("BOOLEAN", description, null);
        }

        Map<String, Object> toSchemaMap() {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("type", type);
            m.put("description", description);
            if (enumValues != null) {
                m.put("enum", enumValues);
            }
            return m;
        }
    }
}
