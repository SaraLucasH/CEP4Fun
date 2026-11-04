package com.cep4fun.flink.jobs.functions;

import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawVisibilityEvent;
import org.apache.flink.api.common.functions.OpenContext;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.util.Map;

public class TooManyPublicFunctionsFunction extends KeyedProcessFunction<String, RawVisibilityEvent, InputEvent> {

    private static final String PUBLIC = "public";
    private static final int MAX_PUBLIC_FUNCTIONS = 4;
    private static final String OUTPUT_TOPIC = "NTD002";

    private transient MapState<String, String> visibilityByBlock;

    @Override
    public void open(OpenContext openContext) {
        visibilityByBlock = getRuntimeContext().getMapState(
                new MapStateDescriptor<>("visibility-by-block", Types.STRING, Types.STRING));
    }

    @Override
    public void processElement(RawVisibilityEvent event, Context ctx, Collector<InputEvent> out) throws Exception {
        visibilityByBlock.put(event.blockId, event.visibility);

        long publicCount = 0;
        for (String visibility : visibilityByBlock.values()) {
            if (PUBLIC.equals(visibility)) {
                publicCount++;
            }
        }
        boolean tooMany = publicCount > MAX_PUBLIC_FUNCTIONS;

        for (Map.Entry<String, String> entry : visibilityByBlock.entries()) {
            InputEvent result = new InputEvent();
            result.timestamp = event.timestamp;
            result.topic = OUTPUT_TOPIC;
            result.sessionId = ctx.getCurrentKey();
            result.blockId = entry.getKey();
            result.param1 = entry.getValue();
            result.error = PUBLIC.equals(entry.getValue()) && tooMany;
            out.collect(result);
        }
    }
}
