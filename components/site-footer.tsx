import { FOOTER_NOTE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted-foreground">{FOOTER_NOTE}</p>
    </footer>
  );
}
