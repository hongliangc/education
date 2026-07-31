import { WorldMapSkeleton } from "@/components/skeleton/WorldMapSkeleton";

export default function GameLoading() {
  return (
    <div aria-label="正在加载" role="status">
      <WorldMapSkeleton />
    </div>
  );
}
