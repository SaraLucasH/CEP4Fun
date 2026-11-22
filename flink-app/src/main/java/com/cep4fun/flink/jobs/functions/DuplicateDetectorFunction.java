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
    // Names touched by the batch in progress; evaluated once its last block arrives.
    private transient MapState<String, Boolean> pendingNames;

    public DuplicateDetectorFunction(String outputTopic) {
        this.outputTopic = outputTopic;
    }

    @Override
    public void open(OpenContext openContext) {
        MapStateDescriptor<String, String> descriptor =
                new MapStateDescriptor<>("name-by-block-" + outputTopic, Types.STRING, Types.STRING);
        nameByBlock = getRuntimeContext().getMapState(descriptor);
        pendingNames = getRuntimeContext().getMapState(
                new MapStateDescriptor<>("pending-names-" + outputTopic, Types.STRING, Types.BOOLEAN));
    }

    @Override
    public void processElement(RawNamedEntityEvent event, Context ctx, Collector<InputEvent> out) throws Exception {
        String oldName = nameByBlock.get(event.blockId);
        nameByBlock.put(event.blockId, event.name);

        pendingNames.put(event.name, true);
        if (oldName != null && !oldName.equals(event.name)) {
            pendingNames.put(oldName, true);
        }

        // The editor sends every block in one batch. Judge duplicates only once the whole
        // batch is known; otherwise the first of two equal names would be scored as correct.
        if (event.last != null && !event.last) {
            return;
        }

        List<String> names = new ArrayList<>();
        for (String n : pendingNames.keys()) {
            names.add(n);
        }
        pendingNames.clear();
        for (String n : names) {
            emitForName(n, event.timestamp, ctx.getCurrentKey(), out);
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
