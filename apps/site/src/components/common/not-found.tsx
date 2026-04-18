import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Image
        alt={"imeetly"}
        height={200}
        loading={"eager"}
        src={"/imeetly-transparent.png"}
        width={200}
      />
      <h1 className="font-bold text-3xl">404 Not Found</h1>
      <h2 className="text-center text-muted-foreground">
        imeetly having trouble finding the <br />
        page you’re looking for.
      </h2>
      <Button render={<Link to={"/"} />} variant="secondary">
        Go Home
      </Button>
    </div>
  );
}
