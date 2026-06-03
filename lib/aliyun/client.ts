import "server-only";

const API_BASE = "https://openapi.aliyundrive.com";
const TOKEN_REFRESH_SKEW_MS = 60_000;

interface AliyunConfig {
  appId: string;
  appSecret: string;
  refreshToken: string;
  driveId?: string;
}

interface CachedToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  defaultDriveId?: string;
}

export interface AliyunOpenFile {
  file_id: string;
  name: string;
  type?: string;
  category?: string;
  parent_file_id?: string;
  drive_id?: string;
  size?: number;
  content_hash?: string;
  file_extension?: string;
  mime_type?: string;
  thumbnail?: string;
  url?: string;
  video_media_metadata?: {
    duration?: string | number;
    width?: number;
    height?: number;
  };
}

export interface AliyunListFilesResult {
  items: AliyunOpenFile[];
}

export interface AliyunDownloadUrl {
  url: string;
  expiration?: string;
  method?: string;
}

export interface AliyunPlayInfo {
  url: string;
  quality?: string;
  templateId?: string;
  width?: number;
  height?: number;
}

export class AliyunConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AliyunConfigError";
  }
}

export class AliyunApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AliyunApiError";
    this.status = status;
    this.code = code;
  }
}

let cachedToken: CachedToken | null = null;
let refreshPromise: Promise<CachedToken> | null = null;

function getConfig(): AliyunConfig {
  const appId = process.env.ALIYUN_APP_ID?.trim();
  const appSecret = process.env.ALIYUN_APP_SECRET?.trim();
  const refreshToken = process.env.ALIYUN_REFRESH_TOKEN?.trim();

  if (!appId || !appSecret || !refreshToken) {
    throw new AliyunConfigError("Aliyun Drive credentials are not configured");
  }

  return {
    appId,
    appSecret,
    refreshToken,
    driveId: process.env.ALIYUN_DRIVE_ID?.trim() || undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function refreshAccessToken(config: AliyunConfig): Promise<CachedToken> {
  const body = {
    client_id: config.appId,
    client_secret: config.appSecret,
    grant_type: "refresh_token",
    refresh_token: cachedToken?.refreshToken ?? config.refreshToken,
  };

  const res = await fetch(`${API_BASE}/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await parseJson(res);

  if (!res.ok || !isRecord(json)) {
    const code = isRecord(json) ? stringValue(json.code) : undefined;
    throw new AliyunApiError("Failed to refresh Aliyun access token", res.status, code);
  }

  const accessToken = stringValue(json.access_token);
  const nextRefreshToken = stringValue(json.refresh_token) ?? body.refresh_token;
  const expiresIn = numberValue(json.expires_in) ?? 7200;
  const defaultDriveId =
    config.driveId ??
    stringValue(json.default_drive_id) ??
    stringValue(json.default_sbox_drive_id) ??
    stringValue(json.drive_id);

  if (!accessToken) {
    throw new AliyunApiError("Aliyun token response is missing access_token", res.status);
  }

  cachedToken = {
    accessToken,
    refreshToken: nextRefreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    defaultDriveId,
  };

  return cachedToken;
}

async function getAccessToken(): Promise<CachedToken> {
  const config = getConfig();
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_SKEW_MS > Date.now()) {
    return cachedToken;
  }
  refreshPromise ??= refreshAccessToken(config).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function requestAliyun<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token.accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await parseJson(res);

  if (!res.ok) {
    const code = isRecord(json) ? stringValue(json.code) : undefined;
    const message = isRecord(json) ? stringValue(json.message) : undefined;
    throw new AliyunApiError(message ?? "Aliyun Drive API request failed", res.status, code);
  }

  return json as T;
}

export async function getAliyunDriveId(): Promise<string> {
  const config = getConfig();
  if (config.driveId) return config.driveId;
  const token = await getAccessToken();
  if (token.defaultDriveId) return token.defaultDriveId;

  const driveInfo = await requestAliyun<Record<string, unknown>>(
    "adrive/v1.0/user/getDriveInfo",
    {},
  );
  const driveId =
    stringValue(driveInfo.default_drive_id) ??
    stringValue(driveInfo.resource_drive_id) ??
    stringValue(driveInfo.backup_drive_id);

  if (!driveId) {
    throw new AliyunApiError("Aliyun drive id is unavailable", 502);
  }

  cachedToken = cachedToken ? { ...cachedToken, defaultDriveId: driveId } : cachedToken;
  return driveId;
}

export async function listAliyunFiles(parentFileId: string): Promise<AliyunOpenFile[]> {
  const driveId = await getAliyunDriveId();
  const allFiles: AliyunOpenFile[] = [];
  let marker: string | undefined;

  do {
    const data = await requestAliyun<{
      items?: AliyunOpenFile[];
      next_marker?: string;
    }>("adrive/v1.0/openFile/list", {
      drive_id: driveId,
      parent_file_id: parentFileId,
      limit: 100,
      marker,
      order_by: "name",
      order_direction: "ASC",
      fields: "*",
    });

    allFiles.push(...(data.items ?? []));
    marker = data.next_marker || undefined;
  } while (marker);

  return allFiles;
}

export async function getAliyunDownloadUrl(fileId: string): Promise<AliyunDownloadUrl> {
  const driveId = await getAliyunDriveId();
  const data = await requestAliyun<AliyunDownloadUrl>("adrive/v1.0/openFile/getDownloadUrl", {
    drive_id: driveId,
    file_id: fileId,
  });

  if (!data.url) {
    throw new AliyunApiError("Aliyun download response is missing url", 502);
  }

  return data;
}

function flattenPlayInfo(value: unknown): AliyunPlayInfo[] {
  if (!isRecord(value)) return [];
  const directUrl = stringValue(value.url);
  if (directUrl) {
    return [
      {
        url: directUrl,
        quality: stringValue(value.quality),
        templateId: stringValue(value.template_id),
        width: numberValue(value.width),
        height: numberValue(value.height),
      },
    ];
  }

  const listKeys = ["video_preview_play_info", "live_transcoding_task_list", "play_info_list"];
  for (const key of listKeys) {
    const item = value[key];
    if (Array.isArray(item)) {
      return item.flatMap(flattenPlayInfo);
    }
    if (isRecord(item)) {
      const nested = flattenPlayInfo(item);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

export async function getAliyunVideoPlayInfo(fileId: string): Promise<AliyunPlayInfo> {
  const driveId = await getAliyunDriveId();
  const data = await requestAliyun<Record<string, unknown>>(
    "adrive/v1.0/openFile/getVideoPreviewPlayInfo",
    {
      drive_id: driveId,
      file_id: fileId,
      category: "live_transcoding",
      template_id: "",
    },
  );

  const options = flattenPlayInfo(data).filter((item) => item.url);
  const hls = options.find((item) => item.url.includes(".m3u8")) ?? options[0];

  if (!hls) {
    throw new AliyunApiError("Aliyun video preview response is missing playable url", 502);
  }

  return hls;
}
