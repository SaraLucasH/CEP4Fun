package com.cep4fun.flink.model;

/**
 * Raw signal: "this block is now named X in this session". Shared detector
 * input for every "duplicated name" event (SYE002 interfaces, SYE003
 * libraries, SYE004 contracts) - they are the same business rule applied to
 * three different kinds of declared entity.
 */
public class RawNamedEntityEvent {
    public String timestamp;
    public String sessionId;
    public String blockId;
    public String name;

    public RawNamedEntityEvent() {
    }
}
