package com.cep4fun.flink.model;

/**
 * Raw signal for DEP001 ("deprecated compiler version"): a version
 * major.minor.patch being compared against the pilot's fixed threshold
 * (encoded as 500, i.e. 0.5.0), using the comparator the pragma itself uses
 * ("greater" for ">=", anything else for a stricter "<=" boundary).
 *
 * The original .siddhi app also carried an "optional version" triple and a
 * "symbolcomparation" field, but never actually used them in its final
 * ifThenElse - only major/minor/patch/comparator feed the real rule, so
 * that is all this detector needs.
 */
public class RawDeprecatedVersionEvent {
    public String timestamp;
    public String sessionId;
    public String blockId;
    public String comparator;
    public int major;
    public int minor;
    public int patch;

    public RawDeprecatedVersionEvent() {
    }
}
