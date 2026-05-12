const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");

function loadConfig() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(os.homedir(), ".drawer", "config.json"), "utf8")
    );
  } catch {
    return {};
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForPort(port, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const s = net.createConnection({ port, host: "127.0.0.1" });
      s.once("connect", () => {
        s.end();
        resolve();
      });
      s.once("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error("server timeout"));
        else setTimeout(tryOnce, 100);
      });
    };
    tryOnce();
  });
}

async function startNextServer() {
  const port = await getFreePort();
  const cfg = loadConfig();
  if (cfg.anthropicApiKey) process.env.ANTHROPIC_API_KEY = cfg.anthropicApiKey;
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.NODE_ENV = "production";

  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  process.chdir(standaloneDir);
  require(path.join(standaloneDir, "server.js"));
  await waitForPort(port);
  return port;
}

async function createWindow() {
  const port = await startNextServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "Drawer",
    backgroundColor: "#008080",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
