package com.cep4fun.flink.model;

public class OutputEvent {
    public String timestamp;
    public String topic;
    public String sessionId;
    public String blockId;
    public String param1;
    public int points;
    public String result; // readable label for which branch of the diagram fired

    public OutputEvent() {
    }

    public OutputEvent(String timestamp, String topic, String sessionId, String blockId, String param1, int points, String result) {
        this.timestamp = timestamp;
        this.topic = topic;
        this.sessionId = sessionId;
        this.blockId = blockId;
        this.param1 = param1;
        this.points = points;
        this.result = result;
    }
}
