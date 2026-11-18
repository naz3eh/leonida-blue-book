import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="inline-block size-3 rounded-sm bg-primary" />
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Cars
          </Link>
          <Link
            href="/submit"
            className="rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-foreground hover:bg-primary/85"
          >
            Report a price
          </Link>
        </nav>
      </div>
    </header>
  );
}
