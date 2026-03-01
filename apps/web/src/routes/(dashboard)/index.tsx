import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEden } from "@/lib/eden";

export const Route = createFileRoute("/(dashboard)/")({
  component: App,
});

function App() {
  const eden = useEden();
  const { data: hello, isLoading } = useQuery(eden.hi.get.queryOptions());

  const echoMutation = useMutation(
    eden.echo.post.mutationOptions({
      onSuccess: (data) => console.log("Echo mutation success", data),
    })
  );

  return (
    <div className="space-y-4 p-4">
      <h1 className="font-bold text-xl">Eden Treaty + TanStack Query</h1>

      <div>
        <h2 className="font-semibold">Query:</h2>
        {isLoading ? <p>Loading...</p> : <p>Server says: {hello}</p>}
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Mutation:</h2>
        <button
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={echoMutation.isPending}
          onClick={() => echoMutation.mutate({ message: "Hello from Web!" })}
          type="button"
        >
          {echoMutation.isPending ? "Sending..." : "Send Echo"}
        </button>
        {echoMutation.data && <p>Echo result: {echoMutation.data.message}</p>}
      </div>
    </div>
  );
}
