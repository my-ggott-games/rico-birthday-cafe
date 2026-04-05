import React from "react";
import { Link } from "react-router-dom";
import TakeoutCup from "../components/common/TakeoutCup";

const patternedPanel =
  "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.45) 0%, transparent 18%), radial-gradient(circle at 82% 24%, rgba(255,255,255,0.28) 0%, transparent 16%), linear-gradient(135deg, rgba(255,255,255,0.12) 25%, transparent 25%) 0 0 / 24px 24px, linear-gradient(315deg, rgba(255,255,255,0.1) 25%, transparent 25%) 0 0 / 24px 24px, linear-gradient(180deg, #ffeab7 0%, #ffb67b 100%)";

const TakeoutCupShowcase: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff8ef_0%,#ffe8d7_34%,#f4b48f_100%)] text-[#4f2f25]">
      <div className="relative isolate mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-10 md:px-10">
        <div className="pointer-events-none absolute inset-x-[-10%] top-[-12%] h-[30rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0)_70%)] blur-3xl" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.34em] text-[#c66e4f]">
              Example Usage
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#5a3128] md:text-6xl">
              Takeout Cup
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#774d41] md:text-base">
              Flat 2D cartoon cup built with CSS shapes only. The sleeve accepts
              a custom background image and is compressed toward the edges so it
              reads like a wrapped band instead of a flat sticker.
            </p>
          </div>

          <Link
            to="/"
            className="rounded-full border border-white/60 bg-white/75 px-5 py-2 text-sm font-bold text-[#8a4d3a] shadow-[0_12px_30px_rgba(139,76,55,0.12)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white"
          >
            Home
          </Link>
        </div>

        <div className="relative z-10 mt-10 grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/55 bg-white/20 p-6 shadow-[0_24px_80px_rgba(125,70,47,0.16)] backdrop-blur-md md:p-8">
            <div className="absolute inset-0 opacity-90" style={{ background: patternedPanel }} />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,244,236,0.5)_100%)]" />

            <div className="relative flex min-h-[32rem] items-end justify-center md:min-h-[38rem]">
              <div className="w-[clamp(13rem,30vw,19rem)]">
                <TakeoutCup holderImage="/app/og/thumbnail.jpg" />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-[2rem] border border-white/55 bg-[rgba(255,250,245,0.7)] p-6 shadow-[0_24px_80px_rgba(125,70,47,0.12)] backdrop-blur-md">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.34em] text-[#c66e4f]">
                Props
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[#72463a]">
                <p>
                  <span className="font-black text-[#5a3128]">holderImage</span>
                  {" "}
                  maps a custom texture onto the sleeve band.
                </p>
                <p>
                  <span className="font-black text-[#5a3128]">className</span>
                  {" "}
                  lets you size or position the component from the outside.
                </p>
                <p>
                  <span className="font-black text-[#5a3128]">Layering</span>
                  {" "}
                  keeps the lid above the straw while the sleeve sits over the cup body.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#fff6f0] p-5 text-left text-sm leading-6 text-[#6f4438] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="font-black uppercase tracking-[0.26em] text-[#ba6749]">
                JSX
              </p>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-6 text-[#77483a]">
{`<TakeoutCup
  holderImage="/app/og/thumbnail.jpg"
  className="drop-shadow-[0_30px_50px_rgba(0,0,0,0.18)]"
/>`}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[1.6rem] bg-white/70 p-4">
                <div className="mx-auto w-24">
                  <TakeoutCup />
                </div>
              </div>
              <div className="rounded-[1.6rem] bg-white/70 p-4">
                <div className="mx-auto w-24">
                  <TakeoutCup
                    holderImage="/assets/codygame/background_1-2.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeoutCupShowcase;
