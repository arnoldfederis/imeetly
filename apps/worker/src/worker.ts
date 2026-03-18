import { NativeConnection, Worker } from "@temporalio/worker";
import * as activities from "./activities";
import { env } from "./env";

async function run() {
  const connection = await NativeConnection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  try {
    const worker = await Worker.create({
      connection,
      namespace: env.TEMPORAL_NAMESPACE,
      taskQueue: "meeting-processing",
      workflowsPath: require.resolve("./workflows"),
      activities,
    });

    console.log(
      `Worker started on task queue: meeting-processing (${env.TEMPORAL_ADDRESS}/${env.TEMPORAL_NAMESPACE})`,
    );
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
