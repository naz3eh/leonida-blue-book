"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useId, useRef, useState } from "react";
import { Turnstile, type TurnstileHandle } from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeCarName } from "@/lib/normalize";
import { MAX_SCREENSHOT_BYTES, SCREENSHOT_TYPES } from "@/lib/schemas";
import { PLATFORM_LABELS, PLATFORMS, SOURCE_DESCRIPTIONS, SOURCE_LABELS, SOURCES } from "@/lib/sources";
import { cn } from "@/lib/utils";
import { submitReport, type SubmitState } from "./actions";

type CarOption = { id: number; slug: string; name: string };

const initialState: SubmitState = { status: "idle", message: "" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function SubmitForm({
  cars,
  initialCarId,
  siteKey,
  uploadsEnabled,
}: {
  cars: CarOption[];
  initialCarId?: number;
  siteKey: string;
  uploadsEnabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(submitReport, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [carId, setCarId] = useState<number | undefined>(initialCarId);
  const [newCarName, setNewCarName] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const ids = { car: useId(), amount: useId(), shot: useId(), newCar: useId() };

  const selected = cars.find((c) => c.id === carId);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    const form = e.currentTarget;
    const file = (form.elements.namedItem("screenshot") as HTMLInputElement | null)?.files?.[0];
    if (file && file.size > MAX_SCREENSHOT_BYTES) {
      setClientError("Screenshot must be 2 MB or smaller");
      return;
    }
    const data = new FormData(form);
    startTransition(async () => {
      await formAction(data);
      turnstileRef.current?.reset();
    });
  }

  function onSuccessReset() {
    formRef.current?.reset();
    setNewCarName(null);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-6" aria-describedby="form-status">
      <div className="space-y-2">
        <Label id={`${ids.car}-label`}>Car</Label>
        {newCarName === null ? (
          <>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-labelledby={`${ids.car}-label`}
                  aria-invalid={Boolean(errors.carId) || undefined}
                  className="h-10 w-full justify-between font-normal"
                  data-testid="car-combobox"
                >
                  <span className={cn(!selected && "text-muted-foreground")}>
                    {selected ? selected.name : "Pick a car"}
                  </span>
                  <ChevronsUpDown aria-hidden className="opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search cars" value={search} onValueChange={setSearch} />
                  <CommandList>
                    <CommandEmpty>No car with that name yet.</CommandEmpty>
                    {cars.length > 0 ? (
                      <CommandGroup heading="Cars">
                        {cars.map((c) => (
                          <CommandItem
                            key={c.id}
                            value={c.name}
                            onSelect={() => {
                              setCarId(c.id);
                              setOpen(false);
                            }}
                          >
                            <Check aria-hidden className={cn(c.id === carId ? "opacity-100" : "opacity-0")} />
                            {c.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : null}
                    <CommandSeparator />
                    <CommandGroup forceMount>
                      <CommandItem
                        forceMount
                        value="__add_new_car__"
                        onSelect={() => {
                          setNewCarName(search ? normalizeCarName(search) : "");
                          setCarId(undefined);
                          setOpen(false);
                        }}
                      >
                        <Plus aria-hidden />
                        Add a new car{search ? `: ${normalizeCarName(search)}` : ""}
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <input type="hidden" name="carId" value={carId ?? ""} />
          </>
        ) : (
          <div className="space-y-2">
            <Input
              id={ids.newCar}
              name="newCarName"
              aria-labelledby={`${ids.car}-label`}
              aria-describedby={`${ids.newCar}-hint`}
              aria-invalid={Boolean(errors.newCarName) || undefined}
              value={newCarName}
              onChange={(e) => setNewCarName(e.target.value)}
              placeholder="New car name, as shown in game"
              maxLength={60}
              autoFocus
              className="h-10"
            />
            <p id={`${ids.newCar}-hint`} className="text-sm text-muted-foreground">
              New cars are checked by a moderator before they show up.{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-4"
                onClick={() => setNewCarName(null)}
              >
                Pick from the list instead
              </button>
            </p>
          </div>
        )}
        <FieldError id={`${ids.car}-error`} message={errors.carId ?? errors.newCarName} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Where did the price come from?</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {SOURCES.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 has-checked:border-primary"
            >
              <input type="radio" name="source" value={s} required className="mt-1 accent-primary" />
              <span>
                <span className="block font-medium">{SOURCE_LABELS[s]}</span>
                <span className="text-sm text-muted-foreground">{SOURCE_DESCRIPTIONS[s]}</span>
              </span>
            </label>
          ))}
        </div>
        <FieldError id="source-error" message={errors.source} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={ids.amount}>Amount (in-game cash, whole dollars)</Label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            $
          </span>
          <Input
            id={ids.amount}
            name="amount"
            inputMode="numeric"
            autoComplete="off"
            placeholder="12500"
            required
            aria-invalid={Boolean(errors.amount) || undefined}
            aria-describedby={errors.amount ? `${ids.amount}-error` : undefined}
            className="h-10 pl-7"
          />
        </div>
        <FieldError id={`${ids.amount}-error`} message={errors.amount} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Platform (optional)</legend>
        <div className="flex flex-wrap gap-4">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="platform" value={p} className="accent-primary" />
              {PLATFORM_LABELS[p]}
            </label>
          ))}
        </div>
      </fieldset>

      {uploadsEnabled ? (
        <div className="space-y-2">
          <Label htmlFor={ids.shot}>Screenshot (optional)</Label>
          <Input
            id={ids.shot}
            name="screenshot"
            type="file"
            accept={SCREENSHOT_TYPES.join(",")}
            aria-describedby={`${ids.shot}-hint`}
            aria-invalid={Boolean(errors.screenshot) || undefined}
            className="h-10 file:text-foreground"
          />
          <p id={`${ids.shot}-hint`} className="text-sm text-muted-foreground">
            PNG, JPEG or WebP, up to 2 MB. We remove photo metadata before saving.
          </p>
          <FieldError id={`${ids.shot}-error`} message={errors.screenshot} />
        </div>
      ) : null}

      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Turnstile siteKey={siteKey} ref={turnstileRef} />

      <div id="form-status" role="status" aria-live="polite">
        {clientError ? (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive" data-testid="form-error">
            {clientError}
          </p>
        ) : state.status === "error" ? (
          <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive" data-testid="form-error">
            {state.message}
          </p>
        ) : state.status === "success" ? (
          <div className="rounded-lg border border-primary/50 bg-primary/10 px-4 py-3" data-testid="form-success">
            <p>{state.message}</p>
            <p className="mt-1 text-sm">
              {state.carSlug ? (
                <Link href={`/cars/${state.carSlug}`} className="text-primary underline underline-offset-4">
                  See the car page
                </Link>
              ) : null}
              {state.carSlug ? " · " : null}
              <button type="button" onClick={onSuccessReset} className="text-primary underline underline-offset-4">
                Clear the form
              </button>
            </p>
          </div>
        ) : null}
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="h-10 px-6">
        {isPending ? "Sending…" : "Send report"}
      </Button>
    </form>
  );
}
