// Stub for tsyringe - only used as a transitive dependency by @peculiar/x509.
// The actual DI functionality is not needed in this app.

const registry = new Map<any, any>();

export function injectable() {
  return (target: any) => target;
}

export const container = {
  resolve<T>(token: any): T {
    return registry.get(token);
  },
  register(token: any, value: any) {
    registry.set(token, value);
  },
  registerSingleton(token: any, value?: any) {
    registry.set(token, value ?? token);
  },
};

export function inject() {
  return (_target: any, _key: string, _index: number) => {};
}

export function singleton() {
  return (target: any) => target;
}
