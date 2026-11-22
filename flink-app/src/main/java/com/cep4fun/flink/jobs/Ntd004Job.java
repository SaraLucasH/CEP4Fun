package com.cep4fun.flink.jobs;

import com.cep4fun.flink.jobs.functions.ProperInheritanceFunction;
import com.cep4fun.flink.model.InputEvent;
import com.cep4fun.flink.model.RawInheritanceEvent;
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

/**NTD004 ("abstract contract inheritance")*/
public class Ntd004Job {

    private static final String KAFKA_BOOTSTRAP = "kafka:9092";
    private static final String RAW_TOPIC = "cep4fun-raw-ntd004";
    private static final String SCORING_INPUT_TOPIC = "cep4fun-events-input";
    private static final String OUTPUT_TOPIC = "NTD004";
    private static final String FORBIDDEN_PARENT = "contract";

    private static final ObjectMapper JSON = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = JobEnvironments.create();

        KafkaSource<String> source = KafkaSource.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setTopics(RAW_TOPIC)
                .setGroupId("cep4fun-ntd004-detector")
                .setStartingOffsets(OffsetsInitializer.latest())
                .setValueOnlyDeserializer(new SimpleStringSchema())
                .build();

        DataStream<String> raw = env.fromSource(source, WatermarkStrategy.noWatermarks(), "kafka-raw-ntd004");

        DataStream<RawInheritanceEvent> events = raw.map(Ntd004Job::parseEvent).name("parse-json");

        DataStream<InputEvent> detected = events
                .filter(e -> e.sessionId != null).keyBy(e -> e.sessionId)
                .process(new ProperInheritanceFunction(OUTPUT_TOPIC, FORBIDDEN_PARENT))
                .name("proper-inheritance-detector");

        DataStream<String> detectedJson = detected.map(Ntd004Job::toJson).name("serialize-json");

        KafkaSink<String> sink = KafkaSink.<String>builder()
                .setBootstrapServers(KAFKA_BOOTSTRAP)
                .setRecordSerializer(KafkaRecordSerializationSchema.builder()
                        .setTopic(SCORING_INPUT_TOPIC)
                        .setValueSerializationSchema(new SimpleStringSchema())
                        .build())
                .build();

        detectedJson.sinkTo(sink).name("kafka-events-input");

        env.execute("CEP4Fun - NTD004 proper inheritance detector (Flink pilot)");
    }

    private static RawInheritanceEvent parseEvent(String json) throws Exception {
        try {
            return JSON.readValue(json, RawInheritanceEvent.class);
        } catch (Exception e) {
            // Mensaje invalido: se devuelve un evento vacio (sin sessionId) que se descarta
            // despues; asi un solo mensaje malo no entra en bucle de reinicios.
            return new RawInheritanceEvent();
        }
    }

    private static String toJson(InputEvent event) throws Exception {
        return JSON.writeValueAsString(event);
    }
}
