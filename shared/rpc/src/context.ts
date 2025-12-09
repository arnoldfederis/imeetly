import { type Context, os } from "@orpc/server";

export interface BaseContext extends Context {
  headers: Headers;
  request: Request;
}

export const base = os.$context<BaseContext>();
