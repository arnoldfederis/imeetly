import { env } from "@repo/env";

const TEMPORAL_HTTP_PORT = 7243;

function getTemporalHttpUrl(): string {
  // Convert gRPC address (temporal:7233) to HTTP API address (temporal:7243)
  const grpcAddress = env.TEMPORAL_ADDRESS;
  const host = grpcAddress.split(":")[0];
  return `http://${host}:${TEMPORAL_HTTP_PORT}`;
}

export async function terminateMeetingWorkflow(meetingId: string) {
  const workflowId = `meeting-${meetingId}`;
  const baseUrl = getTemporalHttpUrl();
  const namespace = env.TEMPORAL_NAMESPACE;

  const url = `${baseUrl}/api/v1/namespaces/${namespace}/workflows/${encodeURIComponent(workflowId)}/terminate`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "Meeting deleted by user" }),
  });

  if (response.ok || response.status === 404) {
    console.log(`[temporal] Terminated workflow ${workflowId}`);
    return;
  }

  const errorText = await response.text();
  console.warn(
    `[temporal] Failed to terminate workflow ${workflowId}: ${response.status} ${errorText}`,
  );
}

export async function startMeetingProcessing(
  meetingId: string,
  options?: { priority?: boolean },
) {
  const workflowId = `meeting-${meetingId}`;
  const baseUrl = getTemporalHttpUrl();
  const namespace = env.TEMPORAL_NAMESPACE;

  const url = `${baseUrl}/api/v1/namespaces/${namespace}/workflows/${encodeURIComponent(workflowId)}`;

  const taskQueue = options?.priority
    ? "meeting-processing-priority"
    : "meeting-processing";

  const body = {
    workflowType: { name: "processMeeting" },
    taskQueue: { name: taskQueue },
    input: {
      payloads: [
        {
          metadata: {
            encoding: Buffer.from("json/plain").toString("base64"),
          },
          data: Buffer.from(JSON.stringify(meetingId)).toString("base64"),
        },
      ],
    },
    workflowId,
    requestId: crypto.randomUUID(),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const data = (await response.json()) as { runId?: string };
    console.log(`[temporal] Started workflow ${workflowId}`);
    return { workflowId, runId: data.runId ?? null };
  }

  // Workflow already running - treat as idempotent success
  if (response.status === 409) {
    console.log(`[temporal] Workflow already running: ${workflowId}`);
    return { workflowId, runId: null };
  }

  const errorText = await response.text();
  console.error(
    `[temporal] Failed to start workflow ${workflowId}: ${response.status} ${errorText}`,
  );
  throw new Error(`Temporal API error: ${response.status} ${errorText}`);
}
