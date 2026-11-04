package com.cep4fun.flink.util;

import org.apache.flink.configuration.CheckpointingOptions;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.configuration.ExternalizedCheckpointRetention;
import org.apache.flink.core.execution.CheckpointingMode;
import org.apache.flink.streaming.api.environment.CheckpointConfig;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

/**
 * Shared checkpointing setup for every job in this pilot. Without it, Flink's
 * KafkaSource never commits consumer offsets, so a job restart replays its
 * whole input topic from the beginning (found this the hard way while
 * testing SYE002). Checkpoints land on the volume shared by the
 * JobManager/TaskManager containers (see docker-compose.yml); checkpoints
 * are also kept on a plain cancel (RETAIN_ON_CANCELLATION), as a safety net
 * on top of proper savepoint-based restarts.
 */
public final class JobEnvironments {

    private static final String CHECKPOINT_DIR = "file:///opt/flink/checkpoints";

    private JobEnvironments() {
    }

    public static StreamExecutionEnvironment create() {
        Configuration configuration = new Configuration();
        configuration.set(CheckpointingOptions.CHECKPOINTS_DIRECTORY, CHECKPOINT_DIR);

        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment(configuration);

        env.enableCheckpointing(10_000, CheckpointingMode.EXACTLY_ONCE);

        CheckpointConfig checkpointConfig = env.getCheckpointConfig();
        checkpointConfig.setMinPauseBetweenCheckpoints(5_000);
        checkpointConfig.setCheckpointTimeout(60_000);
        checkpointConfig.setMaxConcurrentCheckpoints(1);
        checkpointConfig.setExternalizedCheckpointRetention(ExternalizedCheckpointRetention.RETAIN_ON_CANCELLATION);

        return env;
    }
}
