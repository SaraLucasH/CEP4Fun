package com.cep4fun.flink.jobs.functions;

import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawNamedEntityEvent;
import org.apache.flink.api.common.functions.OpenContext;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class DuplicateDetectorFunction extends KeyedProcessFunction<String, RawNamedEntityEvent, InputEvent> {

    private final String outputTopic;

    private transient MapState<String, String> nameByBlock;

    public DuplicateDetectorFunction(String outputTopic) {
        this.outputTopic = outputTopic;
    }

    @Override
    public void open(OpenContext openContext) {
        MapStateDescriptor<String, String> descriptor =
                new MapStateDescriptor<>("name-by-block-" + outputTopic, Types.STRING, Types.STRING);
        nameByBlock = getRuntimeContext().getMapState(descriptor);
    }

    @Override
    public void processElement(RawNamedEntityEvent event, Context ctx, Collector<InputEvent> out) throws Exception {
        String oldName = nameByBlock.get(event.blockId);
        nameByBlock.put(event.blockId, event.name);

        emitForName(event.name, event.timestamp, ctx.getCurrentKey(), out);

        if (oldName != null && !oldName.equals(event.name)) {
            emitForName(oldName, event.timestamp, ctx.getCurrentKey(), out);
        }
    }

    private void emitForName(String name, String timestamp, String sessionId, Collector<InputEvent> out) throws Exception {
        List<String> blocksWithName = new ArrayList<>();
        for (Map.Entry<String, String> entry : nameByBlock.entries()) {
            if (name.equals(entry.getValue())) {
                blocksWithName.add(entry.getKey());
            }
        }

        boolean duplicated = blocksWithName.size() > 1;
        for (String blockId : blocksWithName) {
            InputEvent result = new InputEvent();
            result.timestamp = timestamp;
            result.topic = outputTopic;
            result.sessionId = sessionId;
            result.blockId = blockId;
            result.param1 = name;
            result.error = duplicated;
            out.collect(result);
        }
    }
}
