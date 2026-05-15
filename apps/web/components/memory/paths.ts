export function getMemoryHref(threadId?: string | null) {
  if (!threadId) {
    return "/memory";
  }

  return `/memory/${encodeURIComponent(threadId)}`;
}
