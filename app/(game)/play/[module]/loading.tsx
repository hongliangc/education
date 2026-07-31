import { GameModalSkeleton } from "@/components/skeleton/GameModalSkeleton";

export default function PlayLoading() {
  return (
    <div aria-label="正在加载" role="status">
      <GameModalSkeleton />
    </div>
  );
}
