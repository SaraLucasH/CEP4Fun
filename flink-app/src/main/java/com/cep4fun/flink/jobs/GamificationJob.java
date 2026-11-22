package com.cep4fun.flink.jobs;

import com.cep4fun.flink.jobs.functions.ScoringMagnitudes;
import com.cep4fun.flink.jobs.functions.ScoringRuleFunction;
import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.OutputEvent;
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

import java.util.HashMap;
import java.util.Map;

/* LAYER 2: Gamification logic + EventState update */
public class GamificationJob {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "cep4fun-events-output";

    private static final ScoringMagnitudes DEFAULT_MAGNITUDES = new ScoringMagnitudes(5, 20, 5);

    private static final ObjectMapper JSON = new ObjectMapper();

    /**
     *
     *   F = old "fix" reward        (now also the first-try-correct bonus)
     *   P = old "break" penalty     (unchanged)
     *   k = F/2 - P                 (first fix nets half of a first-try correct, never more - keeps F > P+k > P > 0)
     */
    private static Map<String, ScoringMagnitudes> buildMagnitudesByTopic() {
        Map<String, ScoringMagnitudes> map = new HashMap<>();
        map.put("NTD001", new ScoringMagnitudes(5, 20, 5));
        map.put("NTD002", new ScoringMagnitudes(10, 50, 15));
        map.put("NTD003", new ScoringMagnitudes(10, 50, 15));
        map.put("NTD004", new ScoringMagnitudes(10, 50, 15));
        map.put("SYE001", new ScoringMagnitudes(5, 20, 5));
        map.put("SYE002", new ScoringMagnitudes(5, 30, 10));
        map.put("SYE003", new ScoringMagnitudes(5, 30, 10));
        map.put("SYE004", new ScoringMagnitudes(5, 30, 10));
        map.put("PRG002", new ScoringMagnitudes(5, 20, 5));
        map.put("PRG003", new ScoringMagnitudes(5, 30, 10));
        map.put("PRG004", new ScoringMagnitudes(5, 30, 10));
        map.put("SCE002", new ScoringMagnitudes(5, 40, 15));
        map.put("SCE003", new ScoringMagnitudes(5, 40, 15));
        map.put("SCE005", new ScoringMagnitudes(5, 40, 15));
        map.put("SCE006", new ScoringMagnitudes(5, 40, 15));
        return map;
    }

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(INPUT_TOPIC)
                .setGroupId("cep4fun-gamification")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-events-input");

        DataStream<InputEvent> events = raw.map(GamificationJob::parseEvent).name("parse-json");

        DataStream<OutputEvent> results = events
                .filter(e -> e.sessionId != null && e.blockId != null && e.topic != null)
                .keyBy(InputEvent::blockKey)
                .process(new ScoringRuleFunction(buildMagnitudesByTopic(), DEFAULT_MAGNITUDES))
                .name("scoring-rule");

        DataStream<String> resultsJson = results.map(GamificationJob::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(OUTPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        resultsJson.sinkTo(sink).name("kafka-events-output");

        env.execute("CEP4Fun - Gamification (Flink pilot)");
    }

    private static InputEvent parseEvent(String json) throws Exception {
        try {
            return JSON.readValue(json, InputEvent.class);
        } catch (Exception e) {
            // Mensaje invalido: se devuelve un evento vacio (sin sessionId) que se descarta
            // despues; asi un solo mensaje malo no entra en bucle de reinicios.
            return new InputEvent();
        }
    }

    private static String toJson(OutputEvent output) throws Exception {
        return JSON.writeValueAsString(output);
    }
}
