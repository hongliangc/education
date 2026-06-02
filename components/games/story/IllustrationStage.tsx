"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";

function IllustrationStageImpl({
  images,
  imgIndex,
  fallbackEmoji,
  cover,
}: {
  images: string[];
  imgIndex: number;
  fallbackEmoji: string;
  cover?: string;
}) {
  const src = imgIndex >= 0 ? images[imgIndex] : cover;
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 to-amber-50 ring-1 ring-amber-100">
      {src && !errored ? (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          onError={() => setErrored(true)}
          className="anim-pop-in object-contain"
        />
      ) : (
        <span className="anim-pop-in text-7xl" aria-hidden>
          {fallbackEmoji}
        </span>
      )}
    </div>
  );
}

export const IllustrationStage = memo(IllustrationStageImpl);
