export {};

declare global {
  interface Window {
    electron: {
      getImages: (directoryPath: string) => Promise<string[]>;
      selectDirectory: () => Promise<string | null>;
      readImageFile: () => Promise<string | null>;
      appExit: () => Promise<void>;
    };
  }
}
