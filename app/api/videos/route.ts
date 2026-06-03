import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AliyunApiError, AliyunConfigError } from "@/lib/aliyun/client";
import { getVideoCatalog } from "@/lib/video/catalog";

function videoErrorResponse(error: unknown) {
  if (error instanceof AliyunConfigError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof AliyunApiError) {
    const status = error.status === 404 ? 404 : error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "video_service_unavailable" }, { status: 502 });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const videos = await getVideoCatalog(forceRefresh);
    return NextResponse.json({ videos });
  } catch (error) {
    return videoErrorResponse(error);
  }
}
