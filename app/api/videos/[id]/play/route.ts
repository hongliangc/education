import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AliyunApiError, AliyunConfigError, getAliyunVideoPlayInfo } from "@/lib/aliyun/client";
import { assertVideoInCatalog } from "@/lib/video/catalog";

function playErrorResponse(error: unknown) {
  if (error instanceof AliyunConfigError) {
    return NextResponse.json({ error: "video_unconfigured" }, { status: 503 });
  }
  if (error instanceof AliyunApiError) {
    if (error.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const status = error.status === 503 ? 503 : 502;
    return NextResponse.json({ error: "video_service_unavailable" }, { status });
  }
  return NextResponse.json({ error: "video_service_unavailable" }, { status: 502 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await assertVideoInCatalog(id);
    const play = await getAliyunVideoPlayInfo(id);
    return NextResponse.json({ play });
  } catch (error) {
    return playErrorResponse(error);
  }
}
