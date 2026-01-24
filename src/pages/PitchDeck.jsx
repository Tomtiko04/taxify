import { useEffect, useState } from "react";

export default function PitchDeck() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-green-600">
            Pitch Deck
          </span>
          <h1 className="text-3xl font-bold text-slate-900">TaxBuddy Overview</h1>
          <p className="text-slate-600">
            View or download the latest TaxBuddy pitch deck for partners and pilots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/pitch-deck.html"
            target="_blank"
            rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            Open in new tab
          </a>
          <a
            href="/pitch-deck.html"
            download
            className="btn-secondary inline-flex items-center gap-2"
          >
            Download HTML
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          {!loaded && (
            <div className="flex h-[70vh] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
            </div>
          )}
          <iframe
            title="TaxBuddy Pitch Deck"
            src="/pitch-deck.html"
            className={`w-full ${loaded ? "h-[80vh]" : "h-0"}`}
          />
        </div>
      </div>
    </div>
  );
}
