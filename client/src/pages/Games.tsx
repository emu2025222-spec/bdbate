import {
  ArrowRight,
  Flame,
  Gamepad2,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

const games = [
  {
    name: "Aviator",
    description:
      "Watch the multiplier rise and decide when to exit.",
    path: "/games/aviator",
    icon: "✈",
    label: "Featured",
    accent: "cyan",
  },
  {
    name: "Super 777",
    description:
      "A classic virtual 777-style gaming experience.",
    path: "#",
    icon: "7",
    label: "Popular",
    accent: "blue",
  },
  {
    name: "Super Ace",
    description:
      "Fast rounds with a premium card-game atmosphere.",
    path: "#",
    icon: "A",
    label: "Trending",
    accent: "purple",
  },
  {
    name: "Crazy 777",
    description:
      "A colourful virtual 777 experience built for fun.",
    path: "#",
    icon: "777",
    label: "New",
    accent: "orange",
  },
];

export default function Games() {
  return (
    <div className="min-h-screen bg-[#060912] text-white">
      <Navbar />

      <main className="page-glow mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-[30px] border border-white/[0.08] bg-[#0a1019] p-7 sm:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/[0.06] blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/10 bg-cyan-400/[0.05] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              <Gamepad2 size={13} />
              Game Lobby
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Choose your{" "}
              <span className="text-gradient">
                game.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Explore the available virtual games and
              select an experience that matches your style.
            </p>
          </div>
        </section>

        {/* Games */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, index) => {
            const active = game.path !== "#";

            return (
              <Link
                key={game.name}
                to={game.path}
                onClick={(event) => {
                  if (!active) {
                    event.preventDefault();
                  }
                }}
                className={`group ${
                  !active ? "cursor-default" : ""
                }`}
              >
                <article className="premium-card h-full overflow-hidden">
                  <div className="relative min-h-[300px] p-6">
                    {/* Glow */}
                    <div
                      className={`absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${
                        game.accent === "cyan"
                          ? "bg-cyan-400/10"
                          : game.accent === "blue"
                            ? "bg-blue-500/10"
                            : game.accent === "purple"
                              ? "bg-purple-500/10"
                              : "bg-orange-500/10"
                      }`}
                    />

                    <div className="relative flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                        {game.label}
                      </span>

                      {index === 0 && (
                        <Flame
                          size={17}
                          className="text-orange-400"
                        />
                      )}
                    </div>

                    {/* Game visual */}
                    <div className="relative mt-9 flex h-32 items-center justify-center">
                      <div
                        className={`flex h-28 w-28 items-center justify-center rounded-[30px] border text-4xl font-black shadow-2xl ${
                          game.accent === "cyan"
                            ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300 shadow-cyan-500/10"
                            : game.accent === "blue"
                              ? "border-blue-400/20 bg-blue-400/[0.07] text-blue-300 shadow-blue-500/10"
                              : game.accent === "purple"
                                ? "border-purple-400/20 bg-purple-400/[0.07] text-purple-300 shadow-purple-500/10"
                                : "border-orange-400/20 bg-orange-400/[0.07] text-orange-300 shadow-orange-500/10"
                        }`}
                      >
                        {game.icon}
                      </div>
                    </div>

                    <div className="relative mt-7">
                      <h2 className="text-xl font-black">
                        {game.name}
                      </h2>

                      <p className="mt-2 min-h-[48px] text-xs leading-6 text-slate-500">
                        {game.description}
                      </p>

                      <div
                        className={`mt-6 flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-black transition ${
                          active
                            ? "border-cyan-400/10 bg-cyan-400/[0.05] text-cyan-300 group-hover:bg-cyan-400 group-hover:text-[#031014]"
                            : "border-white/[0.06] bg-white/[0.02] text-slate-600"
                        }`}
                      >
                        <span>
                          {active
                            ? "Play Game"
                            : "Coming Soon"}
                        </span>

                        {active ? (
                          <ArrowRight size={16} />
                        ) : (
                          <Sparkles size={15} />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>

        {/* Bottom banner */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0b1420] to-[#0a0f18] p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                <Zap size={14} />
                Ready to play
              </div>

              <h3 className="mt-2 text-xl font-black">
                Start with Aviator
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your next virtual gaming session is one
                click away.
              </p>
            </div>

            <Link
              to="/games/aviator"
              className="premium-button cyan-button inline-flex items-center gap-2"
            >
              Open Aviator
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}