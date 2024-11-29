import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("electron", {
  getImages: (directoryPath: string) =>
    ipcRenderer.invoke("get-images", directoryPath),
  selectDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
  readImageFile: (imagePath: string) =>
    ipcRenderer.invoke("read-image-file", imagePath),
  appExit: () => ipcRenderer.invoke("app:exit"),
});

// contextBridge.exposeInMainWorld('electron', {
//   selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory')
// });
