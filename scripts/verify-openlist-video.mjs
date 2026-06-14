#!/usr/bin/env node

import process from "node:process";

import {
  isOriginAllowed,
  normalizeBaseUrl,
  parsePlaylistSegments,
  parseVariantPlaylists,
  safeResponseSummary,
  selectPreviewTask,
} from "./lib/openlist-video-preflight.mjs";

const required = [
  "OPENLIST_BASE_URL",
  "OPENLIST_USERNAME",
  "OPENLIST_PASSWORD",
  "OPENLIST_VIDEO_ROOT",
  "OPENLIST_TEST_VIDEO_PATH",
  "OPENLIST_TEST_ORIGIN",
];

for (const name of required) {
  if (!process.env[name]?.trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(2);
  }
}

const baseUrl = normalizeBaseUrl(process.env.OPENLIST_BASE_URL);
const username = process.env.OPENLIST_USERNAME.trim();
const password = process.env.OPENLIST_PASSWORD;
const root = process.env.OPENLIST_VIDEO_ROOT.trim();
const videoPath = process.env.OPENLIST_TEST_VIDEO_PATH.trim();
const origin = process.env.OPENLIST_TEST_ORIGIN.trim();
const maxQuality = process.env.OPENLIST_MAX_VIDEO_QUALITY?.trim() || "FHD";
const timeoutMs = Number(process.env.OPENLIST_REQUEST_TIMEOUT_MS || 15_000);

async function request(path, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readEnvelope(response, label) {
  const json = await response.json().catch(() => undefined);
  if (!response.ok || !json || json.code !== 200) {
    throw new Error(`${label} failed with HTTP ${response.status}`);
  }
  return json.data;
}

async function postJson(path, token, body) {
  return request(path, {
    method: "POST",
    headers: {
      authorization: token,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function fetchPlaylist(url) {
  const response = await fetch(url, {
    headers: { origin },
    redirect: "follow",
    cache: "no-store",
  });
  const summary = safeResponseSummary(response);
  if (!response.ok) throw new Error(`Playlist request failed with HTTP ${response.status}`);
  if (!isOriginAllowed(summary.allowOrigin, origin)) {
    throw new Error("Playlist response does not allow the configured Origin");
  }
  return { response, summary, content: await response.text() };
}

try {
  const loginResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const login = await readEnvelope(loginResponse, "OpenList login");
  const token = typeof login?.token === "string" ? login.token : "";
  if (!token) throw new Error("OpenList login response did not contain a token");

  const listResponse = await postJson("/api/fs/list", token, {
    path: root,
    page: 1,
    per_page: 100,
    refresh: false,
  });
  const list = await readEnvelope(listResponse, "OpenList list");
  const entries = Array.isArray(list?.content) ? list.content : [];
  console.log(`OpenList list: ${entries.length} entries`);

  const previewResponse = await postJson("/api/fs/other", token, {
    path: videoPath,
    method: "video_preview",
    data: {},
  });
  const preview = await readEnvelope(previewResponse, "OpenList video_preview");
  const task = selectPreviewTask(preview, maxQuality);
  if (!task?.url) throw new Error("No finished playable M3U8 task was returned");
  console.log(`Preview quality: ${task.templateId || "unknown"}`);

  let playlist = await fetchPlaylist(task.url);
  let segments = parsePlaylistSegments(playlist.content, task.url);
  if (segments.length === 0) {
    const variants = parseVariantPlaylists(playlist.content, task.url);
    if (variants.length === 0) throw new Error("M3U8 contained no media segments or variants");
    playlist = await fetchPlaylist(variants[0]);
    segments = parsePlaylistSegments(playlist.content, variants[0]);
  }
  if (segments.length === 0) throw new Error("Media playlist contained no segments");

  const segmentResponse = await fetch(segments[0], {
    headers: { origin, range: "bytes=0-1023" },
    redirect: "follow",
    cache: "no-store",
  });
  const segmentSummary = safeResponseSummary(segmentResponse);
  if (!segmentResponse.ok) {
    throw new Error(`Media segment request failed with HTTP ${segmentResponse.status}`);
  }
  if (!isOriginAllowed(segmentSummary.allowOrigin, origin)) {
    throw new Error("Media segment response does not allow the configured Origin");
  }
  await segmentResponse.body?.cancel();

  console.log("Playlist:", playlist.summary);
  console.log("Segment:", segmentSummary);
  console.log("OpenList direct-play preflight passed");
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown preflight failure";
  console.error(`OpenList direct-play preflight failed: ${message}`);
  process.exit(1);
}
