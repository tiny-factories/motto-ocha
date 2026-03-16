import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-card-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={session ? "/log" : "/"}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="text-accent" aria-hidden>
            茶
          </span>
          Motto Ocha
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/teas"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse
          </Link>
          {session && (
            <Link
              href="/log"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Log a tea
            </Link>
          )}
          {session && (
            <Link
              href="/my-lists"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              My lists
            </Link>
          )}
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}
