import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect(`${process.env.NEXT_PUBLIC_APP_BASE_URL ?? ""}/login`);
}
