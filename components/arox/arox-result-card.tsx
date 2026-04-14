type AroxResult = {
  karar: string;
  yorgunluk_skoru: number;
  firsat_skoru: number;
  risk_skoru: number;
  ozet: string;
};

export function AroxResultCard({ result }: { result: AroxResult }) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl">
      <p className="text-xs uppercase tracking-widest text-slate-400">Karar</p>
      <h2 className="mt-2 text-3xl font-bold text-emerald-300">{result.karar}</h2>
      <p className="mt-3 text-slate-300">{result.ozet}</p>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl border border-slate-700 p-3">
          <p className="text-slate-400">Yorgunluk</p>
          <p className="text-xl font-semibold text-white">{result.yorgunluk_skoru}</p>
        </div>
        <div className="rounded-xl border border-slate-700 p-3">
          <p className="text-slate-400">Fırsat</p>
          <p className="text-xl font-semibold text-white">{result.firsat_skoru}</p>
        </div>
        <div className="rounded-xl border border-slate-700 p-3">
          <p className="text-slate-400">Risk</p>
          <p className="text-xl font-semibold text-white">{result.risk_skoru}</p>
        </div>
      </div>
    </article>
  );
}
