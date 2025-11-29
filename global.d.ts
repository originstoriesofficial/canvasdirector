// global.d.ts
export {};

declare global {
  interface Window {
    LemonSqueezy?: {
      Setup: (storeId: string) => void;
      Open: (url: string) => void;
    };
  }
}
