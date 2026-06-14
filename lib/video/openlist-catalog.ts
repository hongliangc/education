export interface OpenListCatalogItem {
  id: string;
  title: string;
  posterUrl?: string;
  durationSec?: number;
  resolution?: string;
  ageBand?: string;
  subject?: string;
  summary?: string;
  order: number;
  cost: number;
  sourcePath: string;
  posterPath?: string;
}

interface CatalogEntry {
  id?: unknown;
  path?: unknown;
  title?: unknown;
  poster?: unknown;
  durationSec?: unknown;
  resolution?: unknown;
  ageBand?: unknown;
  age_band?: unknown;
  subject?: unknown;
  summary?: unknown;
  order?: unknown;
  cost?: unknown;
}

export class OpenListCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenListCatalogError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

function resolveCatalogCost(value: unknown): number {
  if (Number.isInteger(value) && Number(value) >= 0) return Number(value);
  const configured = Number(process.env.VIDEO_DEFAULT_COST);
  return Number.isInteger(configured) && configured >= 0 ? configured : 20;
}

function normalizeRoot(root: string): string {
  return `/${root.split("/").filter(Boolean).join("/")}`;
}

function resolveInsideRoot(root: string, relativePath: string): string {
  if (
    relativePath.startsWith("/") ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new OpenListCatalogError("catalog path must stay inside the video root");
  }
  return root === "/" ? `/${relativePath}` : `${root}/${relativePath}`;
}

export function parseOpenListCatalog(
  content: string,
  videoRoot: string,
  availableFiles: ReadonlySet<string>,
): OpenListCatalogItem[] {
  let value: unknown;
  try {
    value = JSON.parse(content) as unknown;
  } catch {
    throw new OpenListCatalogError("catalog.json is not valid JSON");
  }

  const root = isRecord(value) ? value : {};
  if (root.version !== 1 || !Array.isArray(root.videos)) {
    throw new OpenListCatalogError("catalog.json must use version 1 with a videos array");
  }

  const normalizedRoot = normalizeRoot(videoRoot);
  const ids = new Set<string>();
  const paths = new Set<string>();

  return root.videos.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new OpenListCatalogError(`catalog video at index ${index} must be an object`);
    }
    const entry = raw as CatalogEntry;
    const id = optionalString(entry.id);
    const path = optionalString(entry.path);
    const title = optionalString(entry.title);
    if (!id || !/^[a-z0-9][a-z0-9._-]{0,127}$/.test(id)) {
      throw new OpenListCatalogError(`catalog video at index ${index} has an invalid id`);
    }
    if (ids.has(id)) throw new OpenListCatalogError(`duplicate video id: ${id}`);
    if (!path) throw new OpenListCatalogError(`catalog video ${id} is missing path`);
    if (!title) throw new OpenListCatalogError(`catalog video ${id} is missing title`);
    resolveInsideRoot(normalizedRoot, path);
    if (paths.has(path)) throw new OpenListCatalogError(`duplicate video path: ${path}`);
    if (!availableFiles.has(path)) {
      throw new OpenListCatalogError(`source file does not exist: ${path}`);
    }

    const poster = optionalString(entry.poster);
    if (poster) {
      resolveInsideRoot(normalizedRoot, poster);
      if (!availableFiles.has(poster)) {
        throw new OpenListCatalogError(`poster file does not exist: ${poster}`);
      }
    }
    ids.add(id);
    paths.add(path);

    return {
      id,
      title,
      posterUrl: poster ? `/api/videos/${encodeURIComponent(id)}/poster` : undefined,
      durationSec: optionalNumber(entry.durationSec),
      resolution: optionalString(entry.resolution),
      ageBand: optionalString(entry.ageBand) ?? optionalString(entry.age_band),
      subject: optionalString(entry.subject),
      summary: optionalString(entry.summary),
      order: optionalNumber(entry.order) ?? index + 1,
      cost: resolveCatalogCost(entry.cost),
      sourcePath: resolveInsideRoot(normalizedRoot, path),
      posterPath: poster ? resolveInsideRoot(normalizedRoot, poster) : undefined,
    };
  });
}
