"use client";

import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, mergeCar, renameCar, type AdminState } from "./actions";

const idle: AdminState = { status: "idle", message: "" };

function Message({ state }: { state: AdminState }) {
  if (state.status === "idle") return null;
  return (
    <p role="status" className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-primary"}>
      {state.message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, idle);
  const id = useId();
  return (
    <form action={action} className="max-w-sm space-y-3">
      <Label htmlFor={id}>Admin token</Label>
      <Input id={id} name="token" type="password" autoComplete="current-password" required className="h-10" />
      <Button type="submit" disabled={pending} className="h-10 px-5">
        Sign in
      </Button>
      <Message state={state} />
    </form>
  );
}

export function RenameForm({ carId, name }: { carId: number; name: string }) {
  const [state, action, pending] = useActionState(renameCar, idle);
  const id = useId();
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="carId" value={carId} />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Rename
        </Label>
        <Input id={id} name="name" defaultValue={name} className="h-8 w-56" />
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Rename
      </Button>
      <Message state={state} />
    </form>
  );
}

export function MergeForm({ carId, targets }: { carId: number; targets: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(mergeCar, idle);
  const id = useId();
  if (targets.length === 0) return null;
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="carId" value={carId} />
      <div className="space-y-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          Merge into
        </Label>
        <select
          id={id}
          name="targetId"
          defaultValue=""
          className="h-8 w-56 rounded-lg border border-input bg-input/30 px-2 text-sm"
        >
          <option value="" disabled>
            Pick an approved car
          </option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Merge
      </Button>
      <Message state={state} />
    </form>
  );
}
