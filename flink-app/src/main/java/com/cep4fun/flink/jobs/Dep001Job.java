package com.cep4fun.flink.jobs;

import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawDeprecatedVersionEvent;
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

public class Dep001Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-dep001";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "DEP001";
    private static final String GREATER_OR_EQUAL = "greater";
    private static final int DEPRECATION_THRESHOLD = 500;

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-dep001-detector")
                .setStartingOffsets(OffsetsInitializer.earliest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-dep001");

        DataStream<InputEvent> detected = raw
                .map(Dep001Job::parseEvent).name("parse-json")
                .map(Dep001Job::toInputEvent).name("deprecated-version-check");

        DataStream<String> detectedJson = detected.map(Dep001Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - DEP001 deprecated version detector (Flink pilot)");
    }

    private static InputEvent toInputEvent(RawDeprecatedVersionEvent event) {
        int numericVersion = event.patch > 9
                ? Integer.parseInt("" + event.major + event.minor + event.patch)
                : Integer.parseInt("" + event.major + event.minor + event.patch + "0");

        boolean deprecated = GREATER_OR_EQUAL.equals(event.comparator)
                ? numericVersion < DEPRECATION_THRESHOLD
                : numericVersion <= DEPRECATION_THRESHOLD;

        InputEvent result = new InputEvent();
        result.timestamp = event.timestamp;
        result.topic = OUTPUT_TOPIC;
        result.sessionId = event.sessionId;
        result.blockId = event.blockId;
        result.param1 = String.valueOf(numericVersion);
        result.error = deprecated;
        return result;
    }

    private static RawDeprecatedVersionEvent parseEvent(String json) throws Exception {
        return JSON.readValue(json, RawDeprecatedVersionEvent.class);
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
