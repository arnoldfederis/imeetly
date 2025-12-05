import { type Context, os } from "@orpc/server";

interface BaseContext extends Context {
  headers: Headers;
}

export const base = os.$context<BaseContext>();
