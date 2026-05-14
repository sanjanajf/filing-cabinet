const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const path = require("path");
const net = require("net");
const os = require("os");
const fs = require("fs");
const fsp = require("fs/promises");
const archiver = require("archiver");

const WRITING_DIR = path.join(os.homedir(), "writing");

function safeRel(rel) {
  const norm = path.normalize(rel || "");
  if (!norm || norm.startsWith("..") || path.isAbsolute(norm)) {
    throw new Error("Invalid path");
  }
  return norm;
}

async function walkMd(dir, base = dir) {
  const out = [];
  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") || e.name.startsWith("_")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkMd(full, base)));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(path.relative(base, full));
    }
  }
  return out;
}

ipcMain.handle("export-document", async (event, args) => {
  const safe = safeRel(args && args.relPath);
  const sourcePath = path.join(WRITING_DIR, safe);
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    defaultPath: path.join(os.homedir(), "Desktop", path.basename(safe)),
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  const data = await fsp.readFile(sourcePath);
  await fsp.writeFile(result.filePath, data);
  return { ok: true, path: result.filePath };
});

ipcMain.handle("export-folder", async (event, args) => {
  const safe = safeRel(args && args.slug);
  const sourceDir = path.join(WRITING_DIR, safe);
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showSaveDialog(win, {
    defaultPath: path.join(os.homedir(), "Desktop", `${path.basename(safe)}.zip`),
    filters: [{ name: "Zip", extensions: ["zip"] }],
  });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };

  const mdFiles = await walkMd(sourceDir);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(result.filePath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
    archive.pipe(output);
    for (const rel of mdFiles) {
      archive.file(path.join(sourceDir, rel), { name: rel });
    }
    archive.finalize();
  });

  return { ok: true, path: result.filePath, fileCount: mdFiles.length };
});

// Lock in the app name before requiring Next.js's standalone server, which
// mutates process.title to "next-server (vX.Y.Z)" and chdirs out of our dir.
app.setName("Workspace");

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
  process.env.PORT = String(port);
  process.env.HOSTNAME = "127.0.0.1";
  process.env.NODE_ENV = "production";

  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar.unpacked", ".next", "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  process.chdir(standaloneDir);
  require(path.join(standaloneDir, "server.js"));
  // Next.js's standalone server sets process.title to "next-server (vX.Y.Z)",
  // which leaks into the macOS menu-bar title for unbundled Electron runs.
  // Re-assert our name, and lock the property so nothing can change it back.
  process.title = "Workspace";
  try {
    Object.defineProperty(process, "title", {
      value: "Workspace",
      writable: false,
      configurable: false,
    });
  } catch {
    // best-effort — if another module already locked it, leave it alone
  }
  await waitForPort(port);
  return port;
}

async function createWindow() {
  const port = await startNextServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    title: "Workspace",
    backgroundColor: "#008080",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
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
