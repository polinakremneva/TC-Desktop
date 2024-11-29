import p, { app as i, ipcMain as t, dialog as w, BrowserWindow as d } from "electron";
import { fileURLToPath as u } from "node:url";
import n from "node:path";
import f from "fs";
if (typeof p == "string")
  throw new TypeError("Not running in an Electron environment!");
const { env: m } = process, _ = "ELECTRON_IS_DEV" in m, R = Number.parseInt(m.ELECTRON_IS_DEV, 10) === 1, h = _ ? R : !p.app.isPackaged, a = n.dirname(u(import.meta.url));
process.env.APP_ROOT = n.join(a, "..");
const l = process.env.VITE_DEV_SERVER_URL, S = n.join(process.env.APP_ROOT, "dist-electron"), E = n.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = l ? n.join(process.env.APP_ROOT, "public") : E;
let e;
function g() {
  e = new d({
    icon: n.join(a, "../src/oie-png.ico", "oie-png.ico"),
    webPreferences: {
      preload: n.join(a, "preload.mjs"),
      webSecurity: !1
      // Disable web security to allow loading local files
    },
    fullscreen: !0
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), l ? e.loadURL(l) : e.loadFile(n.join(E, "index.html")), h && e.webContents.openDevTools();
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (i.quit(), e = null);
});
t.handle("get-images", async (c, o) => {
  try {
    return f.readdirSync(o).filter((s) => s.endsWith(".jpg")).map((s) => n.join(o, s));
  } catch (r) {
    return console.error("Error loading images:", r), [];
  }
});
t.handle("dialog:openDirectory", async () => (await w.showOpenDialog(e, {
  properties: ["openDirectory"]
})).filePaths[0]);
t.handle("read-image-file", async (c, o) => {
  try {
    return o.startsWith("file://") && (o = o.replace("file://", "")), console.log("Final Image Path:", o), f.readFileSync(o).toString("base64");
  } catch (r) {
    throw console.error("Error reading image file:", r), r;
  }
});
t.handle("app:exit", () => {
  i.quit();
});
i.on("activate", () => {
  d.getAllWindows().length === 0 && g();
});
i.disableHardwareAcceleration();
i.whenReady().then(g);
export {
  S as MAIN_DIST,
  E as RENDERER_DIST,
  l as VITE_DEV_SERVER_URL
};
