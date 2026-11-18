import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Not found</h1>
      <p className="text-muted-foreground">That page or car isn&apos;t here. New cars show up after a moderator approves them.</p>
      <Link href="/" className="text-primary underline underline-offset-4">
        Back to all cars
      </Link>
    </div>
  );
}
