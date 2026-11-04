package com.cep4fun.flink.jobs.functions;

import com.cep4fun.flink.model.BlockState;
import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.OutputEvent;
import org.apache.flink.api.common.functions.OpenContext;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.util.Map;

/**Yes -> does the error condition hold?
 *             No  -> +F  (correct on the first try)
 *             Yes -> -P
 *    No  -> does the error condition hold?
 *             Yes -> was the previous state "broken"?
 *                      Yes -> 0   (still broken, don't penalize twice)
 *                      No  -> -P  (it was fixed, now it broke again)
 *             No -> was the previous state "broken"?
 *                     No  -> 0   (already correct, no real change)
 *                     Yes -> is this the first time THIS block+event gets fixed?
 *                              Yes -> +(P+k)  (net = +k, real reward)
 *                              No  -> +P      (net = 0, already earned the credit before)
 *
 * P, F and K come from a per-topic ScoringMagnitudes 
 */
public class ScoringRuleFunction extends KeyedProcessFunction<String, InputEvent, OutputEvent> {

    private final Map<String, ScoringMagnitudes> magnitudesByTopic;
    private final ScoringMagnitudes defaultMagnitudes;

    private transient ValueState<BlockState> stateHandle;

    public ScoringRuleFunction(Map<String, ScoringMagnitudes> magnitudesByTopic, ScoringMagnitudes defaultMagnitudes) {
        this.magnitudesByTopic = magnitudesByTopic;
        this.defaultMagnitudes = defaultMagnitudes;
    }

    @Override
    public void open(OpenContext openContext) {
        ValueStateDescriptor<BlockState> descriptor =
                new ValueStateDescriptor<>("block-state", BlockState.class);
        stateHandle = getRuntimeContext().getState(descriptor);
    }

    @Override
    public void processElement(InputEvent event, Context ctx, Collector<OutputEvent> out) throws Exception {
        BlockState state = stateHandle.value();
        if (state == null) {
            state = new BlockState();
        }

        ScoringMagnitudes magnitudes = magnitudesByTopic.getOrDefault(event.topic, defaultMagnitudes);
        int penalty = magnitudes.penalty;
        int firstTryBonus = magnitudes.firstTryBonus;
        int extraCompensation = magnitudes.extraCompensation;

        int points;
        String result;

        if (!state.evaluated) {
            if (event.error) {
                points = -penalty;
                result = "BROKEN_FIRST_TIME";
                state.currentlyBroken = true;
            } else {
                points = firstTryBonus;
                result = "CORRECT_FIRST_TRY";
                state.currentlyBroken = false;
            }
            state.evaluated = true;

        } else if (event.error) {
            if (state.currentlyBroken) {
                points = 0;
                result = "NO_CHANGE_STILL_BROKEN";
            } else {
                points = -penalty;
                result = "WORKING_TO_BROKEN";
                state.currentlyBroken = true;
            }

        } else {
            if (!state.currentlyBroken) {
                points = 0;
                result = "NO_CHANGE_STILL_CORRECT";
            } else {
                state.currentlyBroken = false;
                if (state.timesFixed == 0) {
                    points = penalty + extraCompensation;
                    result = "FIXED_FIRST_TIME";
                } else {
                    points = penalty;
                    result = "FIXED_AGAIN";
                }
                state.timesFixed++;
            }
        }

        stateHandle.update(state);
        out.collect(new OutputEvent(event.timestamp, event.topic, event.sessionId, event.blockId, event.param1, points, result));
    }
}
