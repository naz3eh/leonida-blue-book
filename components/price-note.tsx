import { PRICE_NOTE } from "@/lib/site";

export function PriceNote() {
  return (
    <p className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground" data-testid="price-note">
      {PRICE_NOTE}
    </p>
  );
}
