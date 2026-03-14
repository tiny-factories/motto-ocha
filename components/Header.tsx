import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import { getServerSession } from "next-auth";
import { authOptions, canAccessExpertData } from "@/lib/auth";

export async function Header() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canAccessRestrictedData = canAccessExpertData(role);

  return (
    <header className="border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          Motto Ocha
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/teas"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Teas
          </Link>
          <Link
            href="/farms"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Farms
          </Link>
          {canAccessRestrictedData && (
            <Link
              href="/vendors"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Vendors
            </Link>
          )}
          {canAccessRestrictedData && (
            <Link
              href="/mocktails"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Mocktails
            </Link>
          )}
          <Link
            href="/my-lists"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            My lists
          </Link>
          <Link
            href="/identify"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Identify
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
