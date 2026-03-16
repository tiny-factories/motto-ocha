import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function MobileHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-card-border bg-card/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground"
        >
          <span className="text-accent" aria-hidden>茶</span>
          Motto Ocha
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/teas"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse
          </Link>
          {session ? (
            <Link
              href="/log"
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Log a tea
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
