"use client";

import Script from "next/script";

type Viewer3DProps = {
  src: string | null;
  alt: string;
};

export function Viewer3D({ src, alt }: Viewer3DProps) {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        No 3D model
      </div>
    );
  }

  return (
    <div className="aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      <Script
        src="https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js"
        strategy="lazyOnload"
      />
      {/* @ts-expect-error model-viewer is a custom element */}
      <model-viewer
        src={src}
        alt={alt}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
