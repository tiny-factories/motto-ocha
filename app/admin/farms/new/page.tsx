import { FarmForm } from "@/components/admin/FarmForm";

export default function NewFarmPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add farm
      </h1>
      <FarmForm />
    </div>
  );
}
