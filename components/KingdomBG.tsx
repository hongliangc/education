import Image from "next/image";

export function KingdomBG({ priority = false }: { priority?: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-sky-300">
      <Image
        src="/ui/world/world-bg-mobile-v1.png"
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 639px) 100vw, 1px"
        className="object-cover object-top sm:hidden"
      />
      <Image
        src="/ui/world/world-bg-desktop-v1.png"
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 639px) 1px, 100vw"
        className="hidden object-cover object-center sm:block"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/5 via-transparent to-emerald-900/10" />
    </div>
  );
}
