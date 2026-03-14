import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        Admin
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/teas"
          className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Teas
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Add and edit teas
          </p>
        </Link>
        <Link
          href="/admin/farms"
          className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Farms
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage farms
          </p>
        </Link>
        <Link
          href="/admin/vendors"
          className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Vendors
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage vendors
          </p>
        </Link>
        <Link
          href="/admin/tea-categories"
          className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Tea categories
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tea types (e.g. Green, Matcha)
          </p>
        </Link>
        <Link
          href="/admin/taste-tags"
          className="rounded-lg border border-zinc-200 bg-white p-6 transition hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            Taste tags
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Taste profile tags (e.g. mellow, nutty)
          </p>
        </Link>
      </div>
    </div>
  );
}
