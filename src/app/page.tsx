"use client";

import { useState, useCallback } from "react";

const EXAMPLE_PROMPTS = [
  "A futuristic Tokyo street at sunset with neon signs",
  "Minimalist logo for a sustainable coffee brand",
  "Whimsical forest creatures having a tea party",
  "Abstract geometric pattern in Bauhaus style",
  "Product shot of premium headphones on marble",
  "Retro travel poster for Mars tourism",
];

type Direction = {
  label: string;
  type: string;
  style: string;
  url: string | null;
  outputType?: string | null;
  placeholder: boolean;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const generate = useCallback(
    async (text?: string) => {
      const p = text || prompt;
      if (!p.trim()) return;

      setLoading(true);
      setError("");
      setDirections([]);
      setGeneratedPrompt(p);

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: p }),
        });
        const data = await res.json();

        if (data.error === "API key not configured") {
          setError("API key not configured — showing placeholder grid");
        }
        setDirections(data.directions || []);
      } catch {
        setError("Generation failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [prompt]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm font-bold">
              P
            </div>
            <span className="text-lg font-semibold">
              Picsart{" "}
              <span className="text-white/50 font-normal">×</span>{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Recraft V4
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Exploration Mode
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-8 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Exploration Mode
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-2">
          One prompt. Eight visual directions. Powered by Recraft V4&apos;s
          multi-style generation — from photorealistic renders to native SVG
          vectors.
        </p>
        <p className="text-sm text-white/30">
          Raster • Vector • Icon • Illustration — all from a single creative brief
        </p>
      </section>

      {/* Input */}
      <section className="max-w-3xl mx-auto px-6 pb-6">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                generate();
              }
            }}
            placeholder="Describe what you want to create..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-28 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
          />
          <button
            onClick={() => generate()}
            disabled={loading || !prompt.trim()}
            className="absolute right-3 bottom-3 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Exploring…
              </span>
            ) : (
              "Explore →"
            )}
          </button>
        </div>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLE_PROMPTS.map((ep) => (
            <button
              key={ep}
              onClick={() => {
                setPrompt(ep);
                generate(ep);
              }}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/60 hover:text-white transition-all disabled:opacity-40"
            >
              {ep}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="max-w-3xl mx-auto px-6 pb-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-sm">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <section className="max-w-7xl mx-auto px-6 pb-12">
          <p className="text-center text-white/40 text-sm mb-6">
            Generating 8 visual directions for &ldquo;{generatedPrompt}&rdquo;...
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results Grid */}
      {!loading && directions.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Visual Directions</h2>
              <p className="text-sm text-white/40">
                &ldquo;{generatedPrompt}&rdquo;
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {directions.filter((d) => d.type === "raster").length} Raster
              </span>
              <span className="px-2 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                {directions.filter((d) => d.type === "vector").length} Vector
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {directions.map((dir, i) => (
              <div
                key={i}
                className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-violet-500/30 transition-all"
              >
                <div className="aspect-square relative">
                  {dir.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dir.url}
                      alt={`${dir.label} interpretation`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs text-white/30 text-center">
                        Connect API key to generate
                      </span>
                    </div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{dir.label}</p>
                      <p className="text-xs text-white/50">
                        {dir.type === "vector" ? "SVG" : "WebP"} •{" "}
                        {dir.style}
                      </p>
                    </div>
                    {dir.url && (
                      <a
                        href={dir.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Type badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${
                      dir.type === "vector"
                        ? "bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/30"
                        : "bg-violet-500/30 text-violet-200 border border-violet-500/30"
                    }`}
                  >
                    {dir.type === "vector" ? "SVG" : "RASTER"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      {directions.length === 0 && !loading && (
        <section className="max-w-5xl mx-auto px-6 pb-16 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "🎨",
                title: "8 Visual Directions",
                desc: "From a single prompt, explore photorealistic, illustration, vector, and icon interpretations simultaneously.",
              },
              {
                icon: "📐",
                title: "Native SVG Output",
                desc: "Production-ready vector graphics. Clean paths, scalable to any size, compatible with Figma & Illustrator.",
              },
              {
                icon: "⚡",
                title: "Exploration Mode",
                desc: "Don't choose a style upfront. Let AI show you possibilities, then refine your creative direction.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-white/30">
          <span>Powered by Picsart AI Infrastructure</span>
          <span>
            Recraft V4 • fal.ai •{" "}
            <a
              href="https://picsart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
            >
              picsart.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
