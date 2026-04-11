import { AnalyzeForm } from "@/components/analyze-form";

export default function HomePage() {
  return (
    <section className="space-y-5">
      <div className="panel">
        <p className="text-xs uppercase tracking-[0.2em] text-terminal-300">Decision Terminal</p>
        <h1 className="mt-1 text-2xl font-semibold">Find Mispriced Real Estate Opportunities</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          İlan Skoru scores listing inefficiency, seller fatigue, and negotiation leverage. It is designed for operators hunting asymmetric opportunities, not marketplace browsing.
        </p>
      </div>
      <AnalyzeForm />
    </section>
  );
}
