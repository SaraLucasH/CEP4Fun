package com.cep4fun.flink.jobs.functions;

import java.io.Serializable;

/**
 * P/F/k for one event type (e.g. NTD002 paid out more than NTD001)
 */
public class ScoringMagnitudes implements Serializable {
    public final int penalty;           // P
    public final int firstTryBonus;     // F
    public final int extraCompensation; // k

    public ScoringMagnitudes(int penalty, int firstTryBonus, int extraCompensation) {
        this.penalty = penalty;
        this.firstTryBonus = firstTryBonus;
        this.extraCompensation = extraCompensation;
    }
}
