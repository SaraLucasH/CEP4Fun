package com.cep4fun.flink.model;

import java.io.Serializable;

/**
 * State persisted per (sessionId, blockId, topic) in Flink's ValueState.
 * Equivalent to what used to live in Siddhi's EventState table.
 */
public class BlockState implements Serializable {
    public boolean evaluated = false;      // has this block+event ever been evaluated before?
    public boolean currentlyBroken = false; // last known result: is it currently in an invalid state?
    public int timesFixed = 0;              // how many times it has gone from broken -> correct
}
