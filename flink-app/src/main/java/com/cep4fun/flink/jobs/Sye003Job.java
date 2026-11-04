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

/**SYE003 ("duplicated library")*/
public class Sye003Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-sye003";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "SYE003";

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-sye003-detector")
                .setStartingOffsets(OffsetsInitializer.earliest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-sye003");

        DataStream<RawNamedEntityEvent> events = raw.map(Sye003Job::parseEvent).name("parse-json");

        DataStream<InputEvent> detected = events
                .keyBy(e -> e.sessionId)
                .process(new DuplicateDetectorFunction(OUTPUT_TOPIC))
                .name("duplicate-detector");

        DataStream<String> detectedJson = detected.map(Sye003Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - SYE003 duplicate detector (Flink pilot)");
    }

    private static RawNamedEntityEvent parseEvent(String json) throws Exception {
        return JSON.readValue(json, RawNamedEntityEvent.class);
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
