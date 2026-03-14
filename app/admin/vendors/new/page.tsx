import { VendorForm } from "@/components/admin/VendorForm";

export default function NewVendorPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Add vendor
      </h1>
      <VendorForm />
    </div>
  );
}
