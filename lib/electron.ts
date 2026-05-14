export type ExportResult = {
  ok: boolean;
  path?: string;
  canceled?: boolean;
  fileCount?: number;
};

declare global {
  interface Window {
    electron?: {
      homeDir: string;
      exportDocument: (args: { relPath: string }) => Promise<ExportResult>;
      exportFolder: (args: { slug: string }) => Promise<ExportResult>;
    };
  }
}

export type ExportOutcome = {
  destination: string | null;
  fileCount?: number;
  canceled?: boolean;
};

export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electron;
}

export function tildify(p: string): string {
  if (typeof window === "undefined" || !window.electron) return p;
  const home = window.electron.homeDir;
  if (home && p.startsWith(home)) return "~" + p.slice(home.length);
  return p;
}

export async function exportDocument(relPath: string): Promise<ExportOutcome> {
  if (typeof window !== "undefined" && window.electron) {
    const res = await window.electron.exportDocument({ relPath });
    if (!res.ok || !res.path) return { destination: null, canceled: !!res.canceled };
    return { destination: tildify(res.path) };
  }
  const filename = relPath.split("/").pop() ?? "export.md";
  return downloadFromUrl(
    `/api/export/document?relPath=${encodeURIComponent(relPath)}`,
    filename,
    [{ description: "Markdown", accept: { "text/markdown": [".md"] } }]
  );
}

export async function exportFolder(slug: string): Promise<ExportOutcome> {
  if (typeof window !== "undefined" && window.electron) {
    const res = await window.electron.exportFolder({ slug });
    if (!res.ok || !res.path)
      return { destination: null, canceled: !!res.canceled };
    return { destination: tildify(res.path), fileCount: res.fileCount };
  }
  return downloadFromUrl(
    `/api/export/folder?slug=${encodeURIComponent(slug)}`,
    `${slug}.zip`,
    [{ description: "Zip", accept: { "application/zip": [".zip"] } }],
    true
  );
}

type FilePickerAcceptType = {
  description?: string;
  accept: Record<string, string[]>;
};

type ShowSaveFilePicker = (opts: {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}) => Promise<FileSystemFileHandle>;

async function downloadFromUrl(
  url: string,
  suggestedName: string,
  types: FilePickerAcceptType[],
  readFileCountHeader = false
): Promise<ExportOutcome> {
  const picker = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
    .showSaveFilePicker;
  if (typeof picker === "function") {
    let handle: FileSystemFileHandle;
    try {
      handle = await picker({ suggestedName, types });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") {
        return { destination: null, canceled: true };
      }
      throw err;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    const fileCount = readFileCountHeader
      ? Number(response.headers.get("X-File-Count") ?? "")
      : undefined;
    const writable = await handle.createWritable();
    if (response.body) {
      await response.body.pipeTo(writable);
    } else {
      await writable.write(await response.blob());
      await writable.close();
    }
    return {
      destination: handle.name,
      fileCount: Number.isFinite(fileCount) ? fileCount : undefined,
    };
  }

  let fileCount: number | undefined;
  if (readFileCountHeader) {
    try {
      const head = await fetch(url, { method: "HEAD" });
      const n = Number(head.headers.get("X-File-Count") ?? "");
      if (Number.isFinite(n)) fileCount = n;
    } catch {
      // best effort
    }
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { destination: suggestedName, fileCount };
}
