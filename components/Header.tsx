import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

export function Header() {
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
          <Link
            href="/vendors"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Vendors
          </Link>
          <Link
            href="/my-lists"
            className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            My lists
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
