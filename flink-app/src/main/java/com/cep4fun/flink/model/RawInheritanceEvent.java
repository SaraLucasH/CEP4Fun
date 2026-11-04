package com.cep4fun.flink.model;

/**
 * Raw signal: "this block declares that entity NAME inherits from PARENT".
 * One block = one inheritance edge; an entity can gain, lose or change edges
 * as the student edits the diagram. Shared detector input for NTD003
 * (interface inheritance) and NTD004 (abstract contract inheritance) - same
 * "exactly one parent, and it must not be the forbidden kind" rule, applied
 * to two different kinds of declared entity.
 */
public class RawInheritanceEvent {
    public String timestamp;
    public String sessionId;
    public String blockId;
    public String name;
    public String parent;

    public RawInheritanceEvent() {
    }
}
