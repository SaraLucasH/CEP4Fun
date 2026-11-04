package com.cep4fun.flink.model;

/**
 * Raw event as it arrives over Kafka. The "error" field is already computed
 * by whoever produces the event (e.g. an upstream step that counts
 * duplicates, or a simple threshold check) - this job does not recompute
 * the condition for each of the 17 events; it only applies the scoring
 * policy on top of that condition's result.
 */
public class InputEvent {
    public String timestamp;
    public String topic;     // e.g. "SYE002" = EVENT IDENTIFIER
    public String sessionId;
    public String blockId;
    public String param1;
    public boolean error;    // true = error condition is met => "broken"

    public InputEvent() {
    }

    public String blockKey() {
        return sessionId + "|" + blockId + "|" + topic;
    }
}
