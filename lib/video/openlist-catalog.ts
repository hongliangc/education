import { createHash } from "node:crypto";

const VIDEO_EXTENSIONS = new Set(["mp4", "mkv", "mov", "m4v", "webm", "avi", "ts"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;

export interface OpenListVideoEntry {
  id: string;
  title: string;
  category: string;
  categoryTitle: string;
  categoryOrder: number;
  order: number;
  cost: number;
  sourcePath: string;
  posterPath?: string;
  thumbUrl?: string;
  durationSec?: number;
  resolution?: string;
  ageBand?: string;
  subject?: string;
  summary?: string;
}

export interface CategoryListingFile {
  name: string;
  isDir: boolean;
  thumb?: string;
}

export interface CategoryListing {
  category: string;
  files: ReadonlyArray<CategoryListingFile>;
}

interface VideoOverride {
  id?: string;
  title?: string;
  cost?: number;
  order?: number;
  poster?: string;
  ageBand?: string;
  subject?: string;
  summary?: string;
  resolution?: string;
  durationSec?: number;
}

interface CategoryOverride {
  title?: string;
  order?: number;
}

interface Overrides {
  categories: Map<string, CategoryOverride>;
  videos: Map<string, VideoOverride>;
}

export class OpenListCatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenListCatalogError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function resolveCatalogCost(value: number | undefined): number {
  if (value !== undefined && Number.isInteger(value) && value >= 0) return value;
  const configured = Number(process.env.VIDEO_DEFAULT_COST);
  return Number.isInteger(configured) && configured >= 0 ? configured : 20;
}

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function baseName(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(0, index) : name;
}

// Scene-release noise tokens (resolution / source / codec / audio / group tags).
const RELEASE_TOKEN =
  /^(?:\d{3,4}[pi]|[24]k|x26[45]|h\.?26[45]|hevc|avc|bluray|blu-ray|web-?dl|web-?rip|hdrip|bdrip|dvdrip|remux|hdr10?|hlg|sdr|dts(?:-hd)?|ma|truehd|atmos|ddp?\d(?:\.\d)?|aac|ac3|flac|10bit|8bit|amzn|nf|itunes|it|repack|proper|extended|fgt|ntb|hmax|cmct)$/i;
// Trailing Chinese quality/source suffixes after a separator, e.g. "第04集-蓝光4k".
const TRAILING_CN_QUALITY =
  /[-_\s]+(?:蓝光\s*4?k?|超清|高清|标清|原盘|无水印|修复版|珍藏版|收藏版|完整版|4k|2k|1080[pi]|720[pi])+\s*$/i;

/**
 * Trim a raw filename into a readable title: drop bracketed tags like 【萌娃资源】,
 * cut scene-release junk after the first release token (keeping SxxExx), and strip
 * trailing Chinese quality suffixes. Falls back to the bare basename if it empties out.
 */
export function cleanTitle(rawName: string): string {
  const original = baseName(rawName);
  // Drop bracketed noise: 【…】, ［…］, [...]. Parentheses stay so "(2022)" years survive.
  let title = original.replace(/[【\[［][^】\]］]*[】\]］]/g, " ");
  // Dotted/underscored scene release → spaces, truncated at the first release token.
  if (/[._]/.test(title)) {
    const parts = title.split(/[._]+/).filter(Boolean);
    const cut = parts.findIndex((part) => RELEASE_TOKEN.test(part));
    if (cut >= 0) title = parts.slice(0, cut).join(" ");
  }
  title = title.replace(TRAILING_CN_QUALITY, "").replace(/\s{2,}/g, " ").trim();
  return title || original;
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

/** Stable, regex-safe business id derived from the file's path relative to the video root. */
export function deriveVideoId(relativePath: string): string {
  return createHash("sha1").update(relativePath).digest("hex").slice(0, 16);
}

function parseOverrides(content: string | undefined): Overrides {
  const overrides: Overrides = { categories: new Map(), videos: new Map() };
  if (!content || !content.trim()) return overrides;

  let value: unknown;
  try {
    value = JSON.parse(content) as unknown;
  } catch {
    throw new OpenListCatalogError("catalog.json is not valid JSON");
  }
  if (!isRecord(value)) throw new OpenListCatalogError("catalog.json must be an object");
  if (value.version !== 1) throw new OpenListCatalogError("catalog.json must use version 1");

  if (value.categories !== undefined) {
    if (!isRecord(value.categories)) {
      throw new OpenListCatalogError("catalog.json categories must be an object");
    }
    for (const [key, raw] of Object.entries(value.categories)) {
      if (!isRecord(raw)) throw new OpenListCatalogError(`catalog category ${key} must be an object`);
      overrides.categories.set(key, {
        title: optionalString(raw.title),
        order: optionalNumber(raw.order),
      });
    }
  }

  if (value.videos !== undefined) {
    if (Array.isArray(value.videos)) {
      throw new OpenListCatalogError(
        "catalog.json videos must be an object keyed by '<category>/<filename>'",
      );
    }
    if (!isRecord(value.videos)) {
      throw new OpenListCatalogError("catalog.json videos must be an object");
    }
    for (const [key, raw] of Object.entries(value.videos)) {
      if (!isRecord(raw)) throw new OpenListCatalogError(`catalog video ${key} must be an object`);
      overrides.videos.set(key, {
        id: optionalString(raw.id),
        title: optionalString(raw.title),
        cost: optionalNumber(raw.cost),
        order: optionalNumber(raw.order),
        poster: optionalString(raw.poster),
        ageBand: optionalString(raw.ageBand) ?? optionalString(raw.age_band),
        subject: optionalString(raw.subject),
        summary: optionalString(raw.summary),
        resolution: optionalString(raw.resolution),
        durationSec: optionalNumber(raw.durationSec),
      });
    }
  }

  return overrides;
}

/**
 * Build the category-grouped catalog from each category folder's listing.
 * Pure: takes already-listed folder contents so it stays unit-testable.
 */
export function buildVideoCatalog(
  videoRoot: string,
  categories: ReadonlyArray<CategoryListing>,
  overridesContent?: string,
): OpenListVideoEntry[] {
  const root = normalizeRoot(videoRoot);
  const overrides = parseOverrides(overridesContent);

  // Deterministic default category order: zh-CN by folder name.
  const sortedCategories = [...categories].sort((a, b) =>
    a.category.localeCompare(b.category, "zh-CN"),
  );

  const usedIds = new Set<string>();
  const availableKeys = new Set<string>();
  const entries: OpenListVideoEntry[] = [];

  sortedCategories.forEach((cat, categoryIndex) => {
    const override = overrides.categories.get(cat.category);
    const categoryTitle = override?.title ?? cat.category;
    const categoryOrder = override?.order ?? categoryIndex + 1;

    const imageByBase = new Map<string, string>();
    const thumbByName = new Map<string, string | undefined>();
    const mediaFiles: string[] = [];

    for (const file of cat.files) {
      if (file.isDir) continue;
      availableKeys.add(`${cat.category}/${file.name}`);
      thumbByName.set(file.name, file.thumb);
      const ext = extensionOf(file.name);
      if (IMAGE_EXTENSIONS.has(ext)) {
        imageByBase.set(baseName(file.name).toLowerCase(), file.name);
      } else if (VIDEO_EXTENSIONS.has(ext)) {
        mediaFiles.push(file.name);
      }
    }

    mediaFiles.forEach((name, index) => {
      const relativePath = `${cat.category}/${name}`;
      const ov = overrides.videos.get(relativePath) ?? {};
      const id = ov.id ?? deriveVideoId(relativePath);
      if (!ID_PATTERN.test(id)) {
        throw new OpenListCatalogError(`catalog video ${relativePath} has an invalid id: ${id}`);
      }
      if (usedIds.has(id)) throw new OpenListCatalogError(`duplicate video id: ${id}`);
      usedIds.add(id);

      let posterPath: string | undefined;
      if (ov.poster) {
        posterPath = resolveInsideRoot(root, ov.poster);
      } else {
        const image = imageByBase.get(baseName(name).toLowerCase());
        if (image) posterPath = resolveInsideRoot(root, `${cat.category}/${image}`);
      }

      entries.push({
        id,
        title: ov.title ?? cleanTitle(name),
        category: cat.category,
        categoryTitle,
        categoryOrder,
        order: ov.order ?? index + 1,
        cost: resolveCatalogCost(ov.cost),
        sourcePath: resolveInsideRoot(root, `${cat.category}/${name}`),
        posterPath,
        thumbUrl: thumbByName.get(name),
        durationSec: ov.durationSec,
        resolution: ov.resolution,
        ageBand: ov.ageBand,
        subject: ov.subject,
        summary: ov.summary,
      });
    });
  });

  for (const [key, ov] of overrides.videos) {
    if (!availableKeys.has(key)) {
      throw new OpenListCatalogError(`catalog override references missing file: ${key}`);
    }
    if (ov.poster && !availableKeys.has(ov.poster)) {
      throw new OpenListCatalogError(`catalog poster references missing file: ${ov.poster}`);
    }
  }

  entries.sort(
    (a, b) =>
      a.categoryOrder - b.categoryOrder ||
      a.order - b.order ||
      a.title.localeCompare(b.title, "zh-CN"),
  );
  return entries;
}
