package com.cep4fun.flink.jobs;

import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawModifierEvent;
import com.cep4fun.flink.util.JobEnvironments;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.api.common.serialization.SimpleStringSchema;
import org.apache.flink.connector.kafka.sink.KafkaRecordSerializationSchema;
import org.apache.flink.connector.kafka.sink.KafkaSink;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

/**SCE003 ("public function missing modifiers")*/
public class Sce003Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-sce003";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "SCE003";
    private static final String PUBLIC = "public";

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-sce003-detector")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-sce003");

        DataStream<InputEvent> detected = raw
                .map(Sce003Job::parseEvent).name("parse-json")
                .map(Sce003Job::toInputEvent).name("missing-modifiers-check");

        DataStream<String> detectedJson = detected.map(Sce003Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - SCE003 missing modifiers detector (Flink pilot)");
    }

    private static InputEvent toInputEvent(RawModifierEvent event) {
        boolean missingModifiers = PUBLIC.equals(event.visibility) && event.modifierCount <= 0;

        InputEvent result = new InputEvent();
        result.timestamp = event.timestamp;
        result.topic = OUTPUT_TOPIC;
        result.sessionId = event.sessionId;
        result.blockId = event.blockId;
        result.param1 = event.name;
        result.error = missingModifiers;
        return result;
    }

    private static RawModifierEvent parseEvent(String json) throws Exception {
        try {
            return JSON.readValue(json, RawModifierEvent.class);
        } catch (Exception e) {
            // Mensaje invalido: se devuelve un evento vacio (sin sessionId) que se descarta
            // despues; asi un solo mensaje malo no entra en bucle de reinicios.
            return new RawModifierEvent();
        }
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
