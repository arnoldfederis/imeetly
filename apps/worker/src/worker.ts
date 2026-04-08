import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { env } from "./env";

const TASK_QUEUES = ["meeting-processing", "meeting-processing-priority"];

async function run() {
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  try {
    const workers = await Promise.all(
      TASK_QUEUES.map((taskQueue) =>
        Worker.create({
          connection,
          namespace: env.TEMPORAL_NAMESPACE,
          taskQueue,
          workflowsPath: require.resolve("./workflows"),
          activities,
        }),
      ),
    );

    console.log(
      `Worker started on task queues: ${TASK_QUEUES.join(", ")} (${env.TEMPORAL_ADDRESS}/${env.TEMPORAL_NAMESPACE})`,
    );

    await Promise.all(workers.map((w) => w.run()));
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
