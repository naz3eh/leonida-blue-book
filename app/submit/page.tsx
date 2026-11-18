import type { Metadata } from "next";
import { PriceNote } from "@/components/price-note";
import { listCarOptions } from "@/lib/queries";
import { uploadsEnabled } from "@/lib/storage";
import { SubmitForm } from "./submit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Report a price",
  description: "Tell other players what a stolen car was worth in GTA 6, in in-game cash.",
};

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ car?: string }> }) {
  const { car } = await searchParams;
  const cars = await listCarOptions();
  const initial = car ? cars.find((c) => c.slug === car) : undefined;
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PriceNote />
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Report a price</h1>
        <p className="text-muted-foreground">
          Tell us what you saw in game: the WAINK scanner value, what a fence paid, or what Randy
          asked for. One report per car and source per day.
        </p>
      </div>
      <SubmitForm
        cars={cars}
        initialCarId={initial?.id}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        uploadsEnabled={uploadsEnabled()}
      />
    </div>
  );
}
