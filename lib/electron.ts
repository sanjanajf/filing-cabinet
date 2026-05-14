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

export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electron;
}

export function tildify(p: string): string {
  if (typeof window === "undefined" || !window.electron) return p;
  const home = window.electron.homeDir;
  if (home && p.startsWith(home)) return "~" + p.slice(home.length);
  return p;
}

export async function exportDocument(relPath: string): Promise<string | null> {
  if (!window.electron) {
    throw new Error("Export is only available in the desktop app");
  }
  const res = await window.electron.exportDocument({ relPath });
  if (!res.ok || !res.path) return null;
  return res.path;
}

export async function exportFolder(
  slug: string
): Promise<{ path: string; fileCount: number } | null> {
  if (!window.electron) {
    throw new Error("Export is only available in the desktop app");
  }
  const res = await window.electron.exportFolder({ slug });
  if (!res.ok || !res.path) return null;
  return { path: res.path, fileCount: res.fileCount ?? 0 };
}
