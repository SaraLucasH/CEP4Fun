package com.cep4fun.flink.jobs;

import com.cep4fun.flink.jobs.functions.DuplicateDetectorFunction;
import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawNamedEntityEvent;
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

public class Sye002Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-sye002";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "SYE002";

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-sye002-detector")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-sye002");

        DataStream<RawNamedEntityEvent> events = raw.map(Sye002Job::parseEvent).name("parse-json");

        DataStream<InputEvent> detected = events
                .filter(e -> e.sessionId != null).keyBy(e -> e.sessionId)
                .process(new DuplicateDetectorFunction(OUTPUT_TOPIC))
                .name("duplicate-detector");

        DataStream<String> detectedJson = detected.map(Sye002Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - SYE002 duplicate detector (Flink pilot)");
    }

    private static RawNamedEntityEvent parseEvent(String json) throws Exception {
        try {
            return JSON.readValue(json, RawNamedEntityEvent.class);
        } catch (Exception e) {
            // Mensaje invalido: se devuelve un evento vacio (sin sessionId) que se descarta
            // despues; asi un solo mensaje malo no entra en bucle de reinicios.
            return new RawNamedEntityEvent();
        }
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
