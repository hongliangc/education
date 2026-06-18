export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.OPENLIST_BASE_URL?.trim()) return;

  const { getVideoCatalog } = await import("./lib/video/catalog");
  void getVideoCatalog().catch((error: unknown) => {
    console.warn("Video catalog prewarm failed:", error);
  });
}
