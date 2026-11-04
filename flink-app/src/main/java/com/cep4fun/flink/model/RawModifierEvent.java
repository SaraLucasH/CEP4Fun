package com.cep4fun.flink.model;

/**
 * Raw signal for SCE003 ("missing modifiers on a public function"): a
 * function's current visibility and how many modifiers it currently has
 * attached.
 */
public class RawModifierEvent {
    public String timestamp;
    public String sessionId;
    public String blockId;
    public String name;
    public String visibility;
    public int modifierCount;

    public RawModifierEvent() {
    }
}
