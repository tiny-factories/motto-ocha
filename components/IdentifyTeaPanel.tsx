"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AddToList } from "@/components/AddToList";

type Match = {
  tea: {
    id: string;
    slug: string;
    nameNative: string;
    nameEnglish: string | null;
    imageUrl: string | null;
    farm: { nameNative: string; slug: string } | null;
    vendorTeas: { vendor: { id: string; name: string } }[];
  };
  score: number;
  reason: string;
};

function normalizeBarcode(raw: string): string {
  return raw.replace(/[^\dA-Za-z]/g, "").trim();
}

export function IdentifyTeaPanel() {
  const [text, setText] = useState("");
  const [barcode, setBarcode] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [barcodeSupported, setBarcodeSupported] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<unknown>(null);
  const intervalRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    setBarcodeSupported(typeof window !== "undefined" && "BarcodeDetector" in window);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [previewUrl]);

  const canSearch = useMemo(
    () => Boolean(text.trim() || normalizeBarcode(barcode)),
    [text, barcode]
  );

  async function identify(payload: { text?: string; barcode?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Failed to identify tea"
        );
      }
      setMatches(Array.isArray(data.matches) ? data.matches : []);
    } catch (err) {
      setMatches([]);
      setError(err instanceof Error ? err.message : "Failed to identify tea");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const normalizedBarcode = normalizeBarcode(barcode);
    await identify({
      text: text.trim() || undefined,
      barcode: normalizedBarcode || undefined,
    });
  }

  async function detectBarcodeFromSource(source: HTMLVideoElement | ImageBitmap) {
    if (!barcodeSupported) return null;
    const detectorCtor = (window as Window & { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (input: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> } }).BarcodeDetector;
    if (!detectorCtor) return null;
    if (!detectorRef.current) {
      detectorRef.current = new detectorCtor({
        formats: [
          "ean_13",
          "ean_8",
          "upc_a",
          "upc_e",
          "code_128",
          "code_39",
          "codabar",
          "itf",
          "qr_code",
        ],
      });
    }
    const detector = detectorRef.current as {
      detect: (input: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
    };
    const hits = await detector.detect(source);
    const rawValue = hits.find((hit) => hit.rawValue)?.rawValue;
    return rawValue ? normalizeBarcode(rawValue) : null;
  }

  async function startCameraScan() {
    if (!barcodeSupported) {
      setError("Barcode scanning is not supported in this browser.");
      return;
    }
    setError(null);
    setScanStatus("Starting camera…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setScanStatus("Point camera at barcode…");

      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || scanningRef.current) return;
        scanningRef.current = true;
        try {
          const detected = await detectBarcodeFromSource(videoRef.current);
          if (detected) {
            setBarcode(detected);
            setScanStatus(`Detected barcode: ${detected}`);
            stopCameraScan();
            await identify({ barcode: detected });
          }
        } catch {
          // keep scanning
        } finally {
          scanningRef.current = false;
        }
      }, 700);
    } catch {
      setError("Camera access denied or unavailable.");
      setScanStatus(null);
      stopCameraScan();
    }
  }

  function stopCameraScan() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }

  async function handlePhotoUpload(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreview = URL.createObjectURL(file);
    setPreviewUrl(nextPreview);
    setScanStatus("Photo selected. Checking for barcode…");

    if (!barcodeSupported) {
      setScanStatus(
        "Barcode auto-detection not supported here. Enter barcode/text manually."
      );
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const detected = await detectBarcodeFromSource(bitmap);
      bitmap.close();
      if (detected) {
        setBarcode(detected);
        setScanStatus(`Detected barcode from image: ${detected}`);
        await identify({ barcode: detected });
      } else {
        setScanStatus(
          "No barcode found. Enter label text (native language is fine) and search."
        );
      }
    } catch {
      setScanStatus("Could not process image. Try another photo.");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Identify tea from barcode or label text
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Barcode</label>
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="EAN/UPC/code from package"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Label text (any language)
            </label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 抹茶, Gyokuro, brand name"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !canSearch}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Identifying…" : "Find matching tea"}
          </button>
          <label className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800">
            Take/upload photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePhotoUpload(file);
              }}
            />
          </label>
          {barcodeSupported ? (
            <>
              {!cameraOpen ? (
                <button
                  type="button"
                  onClick={() => void startCameraScan()}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Scan live barcode
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCameraScan}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Stop camera
                </button>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Barcode scanning unavailable in this browser.
            </p>
          )}
        </div>

        {scanStatus && (
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{scanStatus}</p>
        )}
        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}

        {cameraOpen && (
          <div className="overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            <video ref={videoRef} className="w-full bg-black" playsInline muted />
          </div>
        )}
        {previewUrl && (
          <div className="relative h-52 overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
            <Image src={previewUrl} alt="Tea photo preview" fill className="object-cover" unoptimized />
          </div>
        )}
      </form>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Matches
        </h3>
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No matches yet. Scan a barcode, upload a photo, or search by label text.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <article
                key={match.tea.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {match.reason} • {Math.round(match.score * 100)}%
                </p>
                <h4 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {match.tea.nameNative}
                </h4>
                {match.tea.nameEnglish && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {match.tea.nameEnglish}
                  </p>
                )}
                {match.tea.farm && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Farm: {match.tea.farm.nameNative}
                  </p>
                )}
                {match.tea.vendorTeas.length > 0 && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Vendor: {match.tea.vendorTeas[0].vendor.name}
                    {match.tea.vendorTeas.length > 1 ? " +" : ""}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/teas/${match.tea.slug}`}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    View tea
                  </Link>
                </div>
                <AddToList teaId={match.tea.id} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
