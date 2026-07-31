"use client";

import Image from "next/image";
import { memo, useEffect, useState } from "react";

function IllustrationStageImpl({
  images,
  imgIndex,
  fallbackEmoji,
  fallbackImage,
  cover,
}: {
  images: string[];
  imgIndex: number;
  fallbackEmoji: string;
  fallbackImage: string;
  cover?: string;
}) {
  const src = imgIndex >= 0 ? images[imgIndex] : cover ?? fallbackImage;
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-amber-50 shadow-lg ring-2 ring-white">
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
        <div className="anim-pop-in text-center">
          <span className="text-sm font-black text-amber-700">故事插画</span>
          <p className="mt-1 text-xl font-black text-slate-700">{fallbackEmoji}</p>
        </div>
      )}
    </div>
  );
}

export const IllustrationStage = memo(IllustrationStageImpl);
