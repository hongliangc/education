export interface OpenListClientConfig {
  baseUrl: string;
  username: string;
  password: string;
  requestTimeoutMs?: number;
}

export interface OpenListFile {
  name: string;
  size?: number;
  isDir: boolean;
  modified?: string;
  thumb?: string;
  type?: number;
}

export interface OpenListVariant {
  quality: string;
  url: string;
}

export interface OpenListPlayInfo {
  url: string;
  quality?: string;
  /** All finished renditions within the quality cap, ordered highest → lowest. */
  variants: OpenListVariant[];
}

interface OpenListEnvelope {
  code: number;
  message?: string;
  data?: unknown;
}

interface PreviewTask {
  templateId?: string;
  status?: string;
  url?: string;
}

const QUALITY_ORDER = ["QHD", "FHD", "HD", "SD", "LD"];

export class OpenListConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenListConfigError";
  }
}

export class OpenListApiError extends Error {
  readonly status: number;
  readonly code?: number;

  constructor(message: string, status: number, code?: number) {
    super(message);
    this.name = "OpenListApiError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new OpenListConfigError("OPENLIST_BASE_URL must use http or https");
  }
  if (url.username || url.password) {
    throw new OpenListConfigError("OPENLIST_BASE_URL must not contain credentials");
  }
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/$/, "");
}

function parseEnvelope(value: unknown): OpenListEnvelope | undefined {
  if (!isRecord(value)) return undefined;
  const code = asNumber(value.code);
  if (code === undefined) return undefined;
  return {
    code,
    message: asString(value.message),
    data: value.data,
  };
}

function collectPreviewTasks(value: unknown, result: PreviewTask[] = []): PreviewTask[] {
  if (Array.isArray(value)) {
    for (const item of value) collectPreviewTasks(item, result);
    return result;
  }
  if (!isRecord(value)) return result;

  const task = {
    templateId: asString(value.template_id) ?? asString(value.templateId),
    status: asString(value.status),
    url: asString(value.url),
  };
  if (task.templateId || task.status || task.url) result.push(task);

  for (const nested of Object.values(value)) {
    if (Array.isArray(nested) || isRecord(nested)) {
      collectPreviewTasks(nested, result);
    }
  }
  return result;
}

export function selectPreviewTask(value: unknown, maxQuality: string): OpenListPlayInfo | undefined {
  const maxIndex = QUALITY_ORDER.indexOf(maxQuality.toUpperCase());
  const allowed = maxIndex >= 0 ? QUALITY_ORDER.slice(maxIndex) : QUALITY_ORDER;
  const tasks = collectPreviewTasks(value).filter(
    (task) => task.status === "finished" && task.url?.includes(".m3u8"),
  );

  // Collect every finished rendition within the cap, highest quality first, so the
  // client can offer a manual resolution switch without another upstream call.
  const variants: OpenListVariant[] = [];
  for (const quality of allowed) {
    const task = tasks.find((candidate) => candidate.templateId === quality);
    if (task?.url) variants.push({ quality, url: task.url });
  }
  if (variants.length > 0) {
    return { url: variants[0].url, quality: variants[0].quality, variants };
  }

  const fallback = tasks.find((task) => task.url);
  if (fallback?.url) {
    return {
      url: fallback.url,
      quality: fallback.templateId,
      variants: [{ quality: fallback.templateId ?? "SD", url: fallback.url }],
    };
  }
  return undefined;
}

export class OpenListClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;
  private token: string | null = null;
  private loginPromise: Promise<string> | null = null;

  constructor(config: OpenListClientConfig, fetcher: typeof fetch = fetch) {
    if (!config.username || !config.password) {
      throw new OpenListConfigError("OpenList credentials are not configured");
    }
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.username = config.username;
    this.password = config.password;
    this.timeoutMs = config.requestTimeoutMs ?? 15_000;
    this.fetcher = fetcher;
  }

  private async fetchWithTimeout(input: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetcher(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenListApiError("OpenList request timed out", 504);
      }
      throw new OpenListApiError("OpenList request failed", 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async readEnvelope(response: Response, label: string): Promise<OpenListEnvelope> {
    const value = (await response.json().catch(() => undefined)) as unknown;
    const envelope = parseEnvelope(value);
    if (!response.ok || !envelope || envelope.code !== 200) {
      throw new OpenListApiError(
        `${label} failed`,
        response.status || 502,
        envelope?.code,
      );
    }
    return envelope;
  }

  private async login(): Promise<string> {
    if (this.token) return this.token;
    this.loginPromise ??= (async () => {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: this.username, password: this.password }),
        cache: "no-store",
      });
      const envelope = await this.readEnvelope(response, "OpenList login");
      const token = isRecord(envelope.data) ? asString(envelope.data.token) : undefined;
      if (!token) throw new OpenListApiError("OpenList login failed", 502);
      this.token = token;
      return token;
    })().finally(() => {
      this.loginPromise = null;
    });
    return this.loginPromise;
  }

  private async post(path: string, body: Record<string, unknown>, mayRetry = true): Promise<unknown> {
    const token = await this.login();
    const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        authorization: token,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const value = (await response.json().catch(() => undefined)) as unknown;
    const envelope = parseEnvelope(value);
    const unauthorized = response.status === 401 || envelope?.code === 401;
    if (unauthorized && mayRetry) {
      this.token = null;
      return this.post(path, body, false);
    }
    if (!response.ok || !envelope || envelope.code !== 200) {
      throw new OpenListApiError(
        "OpenList API request failed",
        unauthorized ? 401 : response.status || 502,
        envelope?.code,
      );
    }
    return envelope.data;
  }

  async list(path: string, refresh = false): Promise<OpenListFile[]> {
    const files: OpenListFile[] = [];
    let page = 1;
    const perPage = 200;

    while (true) {
      const data = await this.post("/api/fs/list", {
        path,
        page,
        per_page: perPage,
        refresh,
      });
      const record = isRecord(data) ? data : {};
      const content = Array.isArray(record.content) ? record.content : [];
      for (const item of content) {
        if (!isRecord(item)) continue;
        const name = asString(item.name);
        if (!name) continue;
        files.push({
          name,
          isDir: item.is_dir === true,
          size: asNumber(item.size),
          modified: asString(item.modified),
          thumb: asString(item.thumb),
          type: asNumber(item.type),
        });
      }
      const total = asNumber(record.total);
      if (content.length < perPage || (total !== undefined && files.length >= total)) break;
      page++;
    }
    return files;
  }

  async getRawUrl(path: string): Promise<string> {
    const data = await this.post("/api/fs/get", { path, password: "" });
    const rawUrl = isRecord(data) ? asString(data.raw_url) : undefined;
    if (!rawUrl) throw new OpenListApiError("OpenList file URL is unavailable", 502);
    return new URL(rawUrl, this.baseUrl).toString();
  }

  async getRawResponse(path: string): Promise<Response> {
    const rawUrl = await this.getRawUrl(path);
    const response = await this.fetchWithTimeout(rawUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new OpenListApiError("OpenList file download failed", response.status);
    }
    return response;
  }

  async getText(path: string): Promise<string> {
    return (await this.getRawResponse(path)).text();
  }

  /** Fetch an already-resolved external URL (e.g. an Aliyun thumbnail) to proxy it. */
  async getExternalImage(url: string): Promise<Response> {
    const response = await this.fetchWithTimeout(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new OpenListApiError("OpenList thumbnail fetch failed", response.status);
    }
    return response;
  }

  async getVideoPreview(path: string, maxQuality = "FHD"): Promise<OpenListPlayInfo> {
    const data = await this.post("/api/fs/other", {
      path,
      method: "video_preview",
      data: {},
    });
    const play = selectPreviewTask(data, maxQuality);
    if (play) return play;

    // No finished, playable task yet: tell a permanent transcode failure apart
    // from work still in progress, so the client stops retrying a dead video.
    const tasks = collectPreviewTasks(data);
    const stillRunning = tasks.some((task) => task.status === "running");
    const anyFailed = tasks.some((task) => task.status === "failed");
    if (anyFailed && !stillRunning) {
      throw new OpenListApiError("OpenList video transcoding failed", 422);
    }
    throw new OpenListApiError("OpenList video is still preparing", 202);
  }
}
