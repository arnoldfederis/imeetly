import { redirect } from "next/navigation";

export async function requireAuth<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "UNAUTHORIZED"
    ) {
      redirect("/login");
    }
    throw err;
  }
}
