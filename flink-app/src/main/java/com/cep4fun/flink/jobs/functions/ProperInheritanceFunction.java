package com.cep4fun.flink.jobs.functions;

import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawInheritanceEvent;
import org.apache.flink.api.common.functions.OpenContext;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.api.common.state.MapStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ProperInheritanceFunction extends KeyedProcessFunction<String, RawInheritanceEvent, InputEvent> {

    private final String outputTopic;
    private final String forbiddenParent;

    private transient MapState<String, String> nameByBlock;
    private transient MapState<String, String> parentByBlock;

    public ProperInheritanceFunction(String outputTopic, String forbiddenParent) {
        this.outputTopic = outputTopic;
        this.forbiddenParent = forbiddenParent;
    }

    @Override
    public void open(OpenContext openContext) {
        nameByBlock = getRuntimeContext().getMapState(
                new MapStateDescriptor<>("name-by-block-" + outputTopic, Types.STRING, Types.STRING));
        parentByBlock = getRuntimeContext().getMapState(
                new MapStateDescriptor<>("parent-by-block-" + outputTopic, Types.STRING, Types.STRING));
    }

    @Override
    public void processElement(RawInheritanceEvent event, Context ctx, Collector<InputEvent> out) throws Exception {
        String oldName = nameByBlock.get(event.blockId);

        nameByBlock.put(event.blockId, event.name);
        parentByBlock.put(event.blockId, event.parent);

        emitForName(event.name, event.timestamp, ctx.getCurrentKey(), out);

        if (oldName != null && !oldName.equals(event.name)) {
            emitForName(oldName, event.timestamp, ctx.getCurrentKey(), out);
        }
    }

    private void emitForName(String name, String timestamp, String sessionId, Collector<InputEvent> out) throws Exception {
        List<String> blocksWithName = new ArrayList<>();
        Set<String> distinctParents = new HashSet<>();
        for (Map.Entry<String, String> entry : nameByBlock.entries()) {
            if (name.equals(entry.getValue())) {
                blocksWithName.add(entry.getKey());
                distinctParents.add(parentByBlock.get(entry.getKey()));
            }
        }

        boolean proper = distinctParents.size() == 1 && !distinctParents.contains(forbiddenParent);
        for (String blockId : blocksWithName) {
            InputEvent result = new InputEvent();
            result.timestamp = timestamp;
            result.topic = outputTopic;
            result.sessionId = sessionId;
            result.blockId = blockId;
            result.param1 = name;
            result.error = !proper;
            out.collect(result);
        }
    }
}
