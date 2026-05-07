import { createFileRoute, redirect } from "@tanstack/react-router";

const APP_LOGIN_URL = `${import.meta.env.VITE_APP_BASE_URL}/login`;

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    throw redirect({ href: APP_LOGIN_URL });
  },
});
