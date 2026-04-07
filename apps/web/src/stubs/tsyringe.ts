// biome-ignore-all lint/suspicious/noExplicitAny: stub file — types are intentionally loose
// Stub for tsyringe - only used as a transitive dependency by @peculiar/x509.
// The actual DI functionality is not needed in this app.

const registry = new Map<unknown, unknown>();

export function injectable() {
  return (target: unknown) => target;
}

export const container = {
  resolve<T>(token: unknown): T {
    return registry.get(token) as T;
  },
  register(token: unknown, value: unknown) {
    registry.set(token, value);
  },
  registerSingleton(token: unknown, value?: unknown) {
    registry.set(token, value ?? token);
  },
};

export function inject() {
  return (_target: unknown, _key: string, _index: number) => {};
}

export function singleton() {
  return (target: unknown) => target;
}
