interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

interface IdleCallbackOptions {
  timeout?: number;
}

declare global {
  interface Window {
    requestIdleCallback?: (
      callback: (deadline: IdleDeadline) => void,
      options?: IdleCallbackOptions
    ) => number;

    cancelIdleCallback?: (handle: number) => void;
  }
}

export {};
