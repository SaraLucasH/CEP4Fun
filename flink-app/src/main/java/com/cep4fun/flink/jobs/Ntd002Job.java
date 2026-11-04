package com.cep4fun.flink.jobs;

import com.cep4fun.flink.jobs.functions.TooManyPublicFunctionsFunction;
import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawVisibilityEvent;
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

/**NTD002 ("too many public functions")**/
public class Ntd002Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-ntd002";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-ntd002-detector")
                .setStartingOffsets(OffsetsInitializer.earliest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-ntd002");

        DataStream<RawVisibilityEvent> events = raw.map(Ntd002Job::parseEvent).name("parse-json");

        DataStream<InputEvent> detected = events
                .keyBy(e -> e.sessionId)
                .process(new TooManyPublicFunctionsFunction())
                .name("too-many-public-detector");

        DataStream<String> detectedJson = detected.map(Ntd002Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - NTD002 too many public functions detector (Flink pilot)");
    }

    private static RawVisibilityEvent parseEvent(String json) throws Exception {
        return JSON.readValue(json, RawVisibilityEvent.class);
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
