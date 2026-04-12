import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-800 bg-terminal-900/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-terminal-400">
          İlan Skoru
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/">Analyze</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/watchlist">Watchlist</Link>
          <Link href="/notifications">Notifications</Link>
        </nav>
      </div>
    </header>
  );
}
