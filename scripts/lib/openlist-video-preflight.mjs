const QUALITY_ORDER = ["QHD", "FHD", "HD", "SD", "LD"];

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function collectTasks(value, tasks = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectTasks(item, tasks);
    return tasks;
  }
  if (!isRecord(value)) return tasks;

  const templateId =
    typeof value.template_id === "string"
      ? value.template_id
      : typeof value.templateId === "string"
        ? value.templateId
        : undefined;
  const status = typeof value.status === "string" ? value.status : undefined;
  const url = typeof value.url === "string" ? value.url : undefined;
  if (templateId || status || url) {
    tasks.push({ templateId, status, url });
  }

  for (const nested of Object.values(value)) {
    if (Array.isArray(nested) || isRecord(nested)) collectTasks(nested, tasks);
  }
  return tasks;
}

export function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.username || url.password) {
    throw new Error("OPENLIST_BASE_URL must not contain credentials");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OPENLIST_BASE_URL must use http or https");
  }
  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export function selectPreviewTask(value, maxQuality = "FHD") {
  const normalizedMax = String(maxQuality).toUpperCase();
  const maxIndex = QUALITY_ORDER.indexOf(normalizedMax);
  const allowed = maxIndex >= 0 ? QUALITY_ORDER.slice(maxIndex) : QUALITY_ORDER;
  const tasks = collectTasks(value).filter(
    (task) => task.status === "finished" && task.url?.includes(".m3u8"),
  );
  for (const quality of allowed) {
    const match = tasks.find((task) => task.templateId === quality);
    if (match?.url) {
      return {
        templateId: quality,
        status: "finished",
        url: match.url,
      };
    }
  }
  const fallback = tasks.find((task) => task.url);
  return fallback?.url
    ? {
        templateId: fallback.templateId,
        status: fallback.status,
        url: fallback.url,
      }
    : undefined;
}

export function parsePlaylistSegments(content, playlistUrl) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.includes(".m3u8"))
    .map((line) => new URL(line, playlistUrl).toString());
}

export function parseVariantPlaylists(content, playlistUrl) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes(".m3u8"))
    .map((line) => new URL(line, playlistUrl).toString());
}

export function isOriginAllowed(headerValue, origin) {
  if (!headerValue) return false;
  return headerValue
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === origin);
}

export function safeResponseSummary(response) {
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    allowOrigin: response.headers.get("access-control-allow-origin"),
    acceptRanges: response.headers.get("accept-ranges"),
  };
}

