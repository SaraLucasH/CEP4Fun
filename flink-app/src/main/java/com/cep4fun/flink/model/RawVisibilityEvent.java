package com.cep4fun.flink.model;

/**
 * Raw signal: "this block currently has visibility X". Detector input for
 * NTD002 ("too many public functions").
 */
public class RawVisibilityEvent {
    public String timestamp;
    public String sessionId;
    public String blockId;
    public String visibility;

    public RawVisibilityEvent() {
    }
}
