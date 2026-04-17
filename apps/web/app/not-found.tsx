import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
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
        imeetly having hard time to find the page
        <br /> you’re looking for right now.
      </h2>
      <Button render={<Link href={"/"} />} variant="secondary">
        Go Home
      </Button>
    </div>
  );
}
