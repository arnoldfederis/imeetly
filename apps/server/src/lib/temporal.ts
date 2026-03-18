import { env } from "@repo/env";
import {
  Client,
  Connection,
  WorkflowExecutionAlreadyStartedError,
} from "@temporalio/client";

let cachedClient: Client | null = null;

async function getTemporalClient(): Promise<Client> {
  if (cachedClient) return cachedClient;

  const connection = await Connection.connect({
    address: env.TEMPORAL_ADDRESS,
  });

  cachedClient = new Client({
    connection,
    namespace: env.TEMPORAL_NAMESPACE,
  });

  return cachedClient;
}

export async function startMeetingProcessing(meetingId: string) {
  const client = await getTemporalClient();
  const workflowId = `meeting-${meetingId}`;

  try {
    const handle = await client.workflow.start("processMeeting", {
      taskQueue: "meeting-processing",
      args: [meetingId],
      workflowId,
    });

    console.log(`[temporal] Started workflow ${handle.workflowId}`);
    return { workflowId: handle.workflowId, runId: handle.firstExecutionRunId };
  } catch (err) {
    if (err instanceof WorkflowExecutionAlreadyStartedError) {
      // Workflow already running for this meeting — idempotent, return existing
      console.log(`[temporal] Workflow already running: ${workflowId}`);
      return { workflowId, runId: null };
    }
    // Reset cached client on connection errors so next call retries
    cachedClient = null;
    console.error(`[temporal] Failed to start workflow ${workflowId}:`, err);
    throw err;
  }
}
