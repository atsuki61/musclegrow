export {};

declare global {
  interface Window {
    requestIdleCallback: (
      callback: (deadline: IdleDeadline) => void,
      options?: { timeout: number }
    ) => number;
    cancelIdleCallback: (handle: number) => void;
  }

  interface IdleDeadline {
    timeRemaining: () => number;
    readonly didTimeout: boolean;
  }
}
