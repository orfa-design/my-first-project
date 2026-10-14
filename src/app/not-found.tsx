import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="mb-2 text-xl font-semibold">Не знайдено</h1>
      <p className="mb-6 text-sm text-muted">Можливо, запис видалено або посилання неправильне.</p>
      <Link href="/" className="btn-secondary">На головну</Link>
    </div>
  );
}
