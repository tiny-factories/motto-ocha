"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocationAutocomplete } from "@/components/admin/LocationAutocomplete";

const SCALE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "commercial", label: "Commercial" },
  { value: "independent", label: "Independent" },
];

const SINGLE_ORIGIN_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "true", label: "Single origin" },
  { value: "false", label: "Blend" },
];

const CAFFEINE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "decaf", label: "Decaf" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

type Farm = { id: string; nameNative: string; nameEnglish: string | null };
type Vendor = { id: string; name: string };
type TasteTag = { id: string; slug: string; label: string };
type TeaCategory = { id: string; slug: string; label: string; parentId: string | null };

function parseDelimitedValues(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseInfusionSeconds(raw: string): number[] {
  return parseDelimitedValues(raw)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

type TeaFormProps = {
  tea?: {
    id: string;
    nameNative: string;
    nameEnglish: string | null;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    teaModelUrl: string | null;
    packagingModelUrl: string | null;
    region: string | null;
    country: string | null;
    prefecture: string | null;
    farmId: string | null;
    vendorIds: string[];
    singleOrigin: boolean | null;
    scale: string | null;
    year: number | null;
    caffeineLevel: string | null;
    processingNotes: string | null;
    tasteTagIds?: string[];
    categoryIds?: string[];
    alternativeNames?: string[];
    barcodes?: string[];
    defaultLeafGrams?: number | null;
    defaultWaterMl?: number | null;
    defaultTemperatureC?: number | null;
    defaultBrewNotes?: string | null;
    defaultInfusionSeconds?: number[];
  };
  farms: Farm[];
  vendors: Vendor[];
  tasteTags: TasteTag[];
  teaCategories: TeaCategory[];
};

export function TeaForm({ tea, farms, vendors, tasteTags, teaCategories }: TeaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(tea?.imageUrl ?? "");
  const [teaModelUrl, setTeaModelUrl] = useState(tea?.teaModelUrl ?? "");
  const [packagingModelUrl, setPackagingModelUrl] = useState(
    tea?.packagingModelUrl ?? ""
  );

  async function uploadFile(
    file: File,
    prefix: string
  ): Promise<string> {
    const form = new FormData();
    form.set("file", file);
    form.set("prefix", prefix);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nameNative = formData.get("nameNative") as string;
    const nameEnglish = (formData.get("nameEnglish") as string) || null;
    const slug =
      (formData.get("slug") as string) ||
      nameNative
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\u4e00-\u9fff\-]/g, "");
    const description = (formData.get("description") as string) || null;
    const region = (formData.get("region") as string) || null;
    const country = (formData.get("country") as string) || null;
    const prefecture = (formData.get("prefecture") as string) || null;
    const farmId = (formData.get("farmId") as string) || null;
    const vendorIds = formData.getAll("vendorIds") as string[];
    const singleOriginRaw = formData.get("singleOrigin") as string;
    const singleOrigin = singleOriginRaw === "true" ? true : singleOriginRaw === "false" ? false : null;
    const scale = (formData.get("scale") as string) || null;
    const yearRaw = formData.get("year") as string;
    const year = yearRaw && yearRaw.trim() !== "" ? parseInt(yearRaw, 10) : null;
    const caffeineLevel = (formData.get("caffeineLevel") as string) || null;
    const processingNotes = (formData.get("processingNotes") as string) || null;
    const tasteTagIds = formData.getAll("tasteTagIds") as string[];
    const categoryIds = formData.getAll("categoryIds") as string[];
    const alternativeNames = parseDelimitedValues(
      (formData.get("alternativeNames") as string) || ""
    );
    const barcodes = parseDelimitedValues((formData.get("barcodes") as string) || "");
    const defaultLeafGramsRaw = (formData.get("defaultLeafGrams") as string) || "";
    const defaultWaterMlRaw = (formData.get("defaultWaterMl") as string) || "";
    const defaultTemperatureCRaw = (formData.get("defaultTemperatureC") as string) || "";
    const defaultBrewNotes = (formData.get("defaultBrewNotes") as string) || null;
    const defaultInfusionSeconds = parseInfusionSeconds(
      (formData.get("defaultInfusionSeconds") as string) || ""
    );
    const defaultLeafGrams =
      defaultLeafGramsRaw.trim() === ""
        ? null
        : Number.parseFloat(defaultLeafGramsRaw);
    const defaultWaterMl =
      defaultWaterMlRaw.trim() === "" ? null : Number.parseInt(defaultWaterMlRaw, 10);
    const defaultTemperatureC =
      defaultTemperatureCRaw.trim() === ""
        ? null
        : Number.parseInt(defaultTemperatureCRaw, 10);

    const imageFile = formData.get("image") as File | null;
    const teaModelFile = formData.get("teaModel") as File | null;
    const packagingFile = formData.get("packagingModel") as File | null;

    try {
      let finalImageUrl = imageUrl;
      let finalTeaModelUrl = teaModelUrl;
      let finalPackagingUrl = packagingModelUrl;

      if (imageFile?.size) {
        finalImageUrl = await uploadFile(imageFile, "teas");
      }
      if (teaModelFile?.size) {
        finalTeaModelUrl = await uploadFile(teaModelFile, "models");
      }
      if (packagingFile?.size) {
        finalPackagingUrl = await uploadFile(packagingFile, "models");
      }

      const body = {
        nameNative,
        nameEnglish,
        slug,
        description,
        region,
        country,
        prefecture,
        farmId: farmId || null,
        vendorIds: vendorIds.filter(Boolean),
        imageUrl: finalImageUrl || null,
        teaModelUrl: finalTeaModelUrl || null,
        packagingModelUrl: finalPackagingUrl || null,
        singleOrigin,
        scale,
        year,
        caffeineLevel,
        processingNotes,
        tasteTagIds: tasteTagIds.filter(Boolean),
        tasteTagRanks: tasteTagIds.filter(Boolean).map((_, i) => i + 1),
        categoryIds: categoryIds.filter(Boolean),
        alternativeNames,
        barcodes,
        defaultLeafGrams: Number.isFinite(defaultLeafGrams) ? defaultLeafGrams : null,
        defaultWaterMl: Number.isFinite(defaultWaterMl) ? defaultWaterMl : null,
        defaultTemperatureC: Number.isFinite(defaultTemperatureC)
          ? defaultTemperatureC
          : null,
        defaultBrewNotes: defaultBrewNotes?.trim() ? defaultBrewNotes.trim() : null,
        defaultInfusionSeconds,
      };

      const url = tea ? `/api/admin/teas/${tea.id}` : "/api/admin/teas";
      const method = tea ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save");
      }
      router.push("/admin/teas");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium">Native name *</label>
        <input
          name="nameNative"
          defaultValue={tea?.nameNative}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">English label</label>
        <input
          name="nameEnglish"
          defaultValue={tea?.nameEnglish ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          name="slug"
          defaultValue={tea?.slug}
          placeholder="auto from name if empty"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          name="description"
          defaultValue={tea?.description ?? ""}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">
          Alternative names (other languages)
        </label>
        <textarea
          name="alternativeNames"
          defaultValue={(tea?.alternativeNames ?? []).join("\n")}
          rows={3}
          placeholder="One name per line (or comma-separated)"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Barcodes</label>
        <textarea
          name="barcodes"
          defaultValue={(tea?.barcodes ?? []).join("\n")}
          rows={2}
          placeholder="One barcode per line (EAN/UPC/etc.)"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
          Default brewing guide
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Leaf (grams)</label>
            <input
              name="defaultLeafGrams"
              type="number"
              step="0.1"
              min="0"
              defaultValue={tea?.defaultLeafGrams ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Water (ml)</label>
            <input
              name="defaultWaterMl"
              type="number"
              min="0"
              defaultValue={tea?.defaultWaterMl ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Temperature (°C)</label>
            <input
              name="defaultTemperatureC"
              type="number"
              min="0"
              max="100"
              defaultValue={tea?.defaultTemperatureC ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">
            Infusion steep times (seconds)
          </label>
          <input
            name="defaultInfusionSeconds"
            defaultValue={(tea?.defaultInfusionSeconds ?? []).join(", ")}
            placeholder="e.g. 30, 45, 60, 90"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Comma or newline separated. This enables multi-steep guidance.
          </p>
        </div>
        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium">Brew notes</label>
          <textarea
            name="defaultBrewNotes"
            rows={2}
            defaultValue={tea?.defaultBrewNotes ?? ""}
            placeholder="e.g. Rinse quickly. Keep lid open between infusions."
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Farm</label>
          <select
            name="farmId"
            defaultValue={tea?.farmId ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">—</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nameNative} {f.nameEnglish && `(${f.nameEnglish})`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Vendors (where to buy)</label>
          <select
            name="vendorIds"
            multiple
            defaultValue={tea?.vendorIds ?? []}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            size={Math.min(6, vendors.length + 1)}
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hold Ctrl/Cmd to select multiple
          </p>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Location search</label>
        <LocationAutocomplete placeholder="Search to fill country, prefecture, region (leave blank to use farm’s location)" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <input
            name="country"
            defaultValue={tea?.country ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Prefecture / Region</label>
          <input
            name="prefecture"
            defaultValue={tea?.prefecture ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Region</label>
          <input
            name="region"
            defaultValue={tea?.region ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Single origin</label>
          <select
            name="singleOrigin"
            defaultValue={tea?.singleOrigin === true ? "true" : tea?.singleOrigin === false ? "false" : ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {SINGLE_ORIGIN_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Scale</label>
          <select
            name="scale"
            defaultValue={tea?.scale ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            {SCALE_OPTIONS.map((o) => (
              <option key={o.value || "none"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Year (harvest/vintage)</label>
        <input
          name="year"
          type="number"
          min={1900}
          max={2100}
          defaultValue={tea?.year ?? ""}
          placeholder="e.g. 2024"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Caffeine level</label>
        <select
          name="caffeineLevel"
          defaultValue={tea?.caffeineLevel ?? ""}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        >
          {CAFFEINE_OPTIONS.map((o) => (
            <option key={o.value || "none"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Processing notes</label>
        <textarea
          name="processingNotes"
          defaultValue={tea?.processingNotes ?? ""}
          rows={2}
          placeholder="e.g. steamed, shade-grown, pan-fired"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>
      {tasteTags.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">Taste tags</label>
          <select
            name="tasteTagIds"
            multiple
            defaultValue={tea?.tasteTagIds ?? []}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            size={Math.min(6, tasteTags.length + 1)}
          >
            {tasteTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hold Ctrl/Cmd to select multiple. Order = rank.
          </p>
        </div>
      )}
      {teaCategories.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium">Tea type / category</label>
          <select
            name="categoryIds"
            multiple
            defaultValue={tea?.categoryIds ?? []}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            size={Math.min(8, teaCategories.length + 1)}
          >
            {teaCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parentId ? `${c.label} (child)` : c.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Hold Ctrl/Cmd to select multiple (e.g. Green + Matcha).
          </p>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium">Image</label>
        {imageUrl && (
          <p className="mb-1 text-xs text-zinc-500">Current: {imageUrl}</p>
        )}
        <input
          type="file"
          name="image"
          accept="image/*"
          className="w-full text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">3D tea model (GLB)</label>
        {teaModelUrl && (
          <p className="mb-1 text-xs text-zinc-500">Current: set</p>
        )}
        <input
          type="file"
          name="teaModel"
          accept=".glb,.gltf"
          className="w-full text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">3D packaging model (GLB)</label>
        {packagingModelUrl && (
          <p className="mb-1 text-xs text-zinc-500">Current: set</p>
        )}
        <input
          type="file"
          name="packagingModel"
          accept=".glb,.gltf"
          className="w-full text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Saving…" : tea ? "Update tea" : "Create tea"}
        </button>
        <a
          href="/admin/teas"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 dark:text-zinc-300"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
