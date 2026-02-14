export {};

declare global {
  interface RequestInit {
    headers?: HeadersInit | (() => HeadersInit);
  }
}
