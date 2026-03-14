import { IdentifyTeaPanel } from "@/components/IdentifyTeaPanel";

export default function IdentifyTeaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        Identify a tea
      </h1>
      <p className="mb-8 max-w-3xl text-zinc-600 dark:text-zinc-300">
        Scan a barcode or take a package photo to quickly find the tea in the
        catalog, then add it to your lists.
      </p>
      <IdentifyTeaPanel />
    </div>
  );
}
