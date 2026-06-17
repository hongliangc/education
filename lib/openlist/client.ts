import "server-only";

import {
  OpenListApiError,
  OpenListClient,
  OpenListConfigError,
} from "@/lib/openlist/client-core";

export { OpenListApiError, OpenListConfigError };
export type {
  OpenListFile,
  OpenListPlayInfo,
  OpenListVariant,
} from "@/lib/openlist/client-core";

let client: OpenListClient | null = null;

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new OpenListConfigError(`${name} is not configured`);
  return value;
}

export function getOpenListClient(): OpenListClient {
  client ??= new OpenListClient({
    baseUrl: required("OPENLIST_BASE_URL"),
    username: required("OPENLIST_USERNAME"),
    password: required("OPENLIST_PASSWORD"),
    requestTimeoutMs: Number(process.env.OPENLIST_REQUEST_TIMEOUT_MS || 15_000),
  });
  return client;
}
