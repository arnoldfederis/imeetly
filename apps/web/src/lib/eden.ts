import { treaty } from "@elysiajs/eden";
import { clientEnv } from "@repo/env";
import type { App } from "@repo/server";
import type { EdenOptionsProxy } from "eden-tanstack-react-query";
import { createEdenTanStackQuery } from "eden-tanstack-react-query";

const edenQuery = createEdenTanStackQuery<App>();

export const EdenProvider = edenQuery.EdenProvider;

type KebabToCamel<S extends string> = S extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<KebabToCamel<Tail>>}`
  : S;

type CamelCaseProxy<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends object
    ? {
        [K in keyof T as K extends string
          ? KebabToCamel<K>
          : K]: CamelCaseProxy<T[K]>;
      }
    : T;

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
}

function createCamelProxy<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string") return Reflect.get(target, prop);
      const val = Reflect.get(target, camelToKebab(prop));
      return val !== null && typeof val === "object"
        ? createCamelProxy(val as object)
        : val;
    },
  });
}

export function useEden(): CamelCaseProxy<EdenOptionsProxy<App>> {
  return edenQuery.useEden() as unknown as CamelCaseProxy<
    EdenOptionsProxy<App>
  >;
}

export const eden = createCamelProxy(
  treaty<App>(clientEnv.VITE_SERVER_URL, {
    fetch: {
      credentials: "include",
      mode: "cors",
    },
  }),
);
