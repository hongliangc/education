import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getOpenListClient,
  OpenListApiError,
  OpenListConfigError,
} from "@/lib/openlist/client";
import { getVideoSource, OpenListCatalogError } from "@/lib/video/catalog";

function posterErrorResponse(error: unknown): NextResponse {
  if (error instanceof OpenListConfigError || error instanceof OpenListCatalogError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof OpenListApiError) {
    return NextResponse.json(
      { error: error.status === 404 ? "Not found" : "video_service_unavailable" },
      { status: error.status === 404 ? 404 : 502 },
    );
  }
  return NextResponse.json({ error: "video_service_unavailable" }, { status: 502 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const video = await getVideoSource(id);
    if (!video?.posterPath) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const upstream = await getOpenListClient().getRawResponse(video.posterPath);
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      await upstream.body?.cancel();
      return NextResponse.json({ error: "invalid_poster" }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return posterErrorResponse(error);
  }
}
