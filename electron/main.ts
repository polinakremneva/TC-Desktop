import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs";
import isDev from "electron-is-dev";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] to avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, "../src/oie-png.ico", "oie-png.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      webSecurity: false, // Disable web security to allow loading local files
    },
    fullscreen: true,
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  if (isDev) {
    win.webContents.openDevTools(); // Open DevTools if in development mode
  }
}

// Quit when all windows are closed, except on macOS.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

// Handling the 'get-images' IPC event
ipcMain.handle("get-images", async (event: any, directoryPath: string) => {
  event;
  try {
    const files: string[] = fs
      .readdirSync(directoryPath)
      .filter((file: string) => file.endsWith(".jpg") || file.endsWith(".png")); // Filters .jpg files
    return files.map((file: string) => path.join(directoryPath, file)); // Return full file paths
  } catch (error) {
    console.error("Error loading images:", error);
    return [];
  }
});

ipcMain.handle("dialog:openDirectory", async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ["openDirectory"],
  });
  return result.filePaths[0]; // Return the selected directory path
});
//@ts-ignore
ipcMain.handle("read-image-file", async (event, imagePath) => {
  try {
    // Remove 'file://' prefix if present
    if (imagePath.startsWith("file://")) {
      imagePath = imagePath.replace("file://", "");
    }

    // Log the final image path for debugging
    console.log("Final Image Path:", imagePath);

    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    console.error("Error reading image file:", error);
    throw error;
  }
});

ipcMain.handle("app:exit", () => {
  app.quit();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window when the dock icon is clicked.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.disableHardwareAcceleration();

app.whenReady().then(createWindow);
