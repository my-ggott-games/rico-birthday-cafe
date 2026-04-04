import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AchievementIcon } from "../components/common/AchievementIcon";
import { AppIcon } from "../components/common/AppIcon";

type SampleAchievement = {
  code: string;
  title: string;
  description: string;
  iconUrl: string;
  earned: boolean;
  active: boolean;
  unlockedAt: string | null;
};

const SAMPLE_ACHIEVEMENTS: SampleAchievement[] = [
  {
    code: "ASPARAGUS_EXCALIBUR",
    title: "성검 아스파라거스",
    description: "성검 아스파라거스를 키웠다.",
    iconUrl: "Sword",
    earned: true,
    active: false,
    unlockedAt: "2026-04-04T04:20:00.000Z",
  },
  {
    code: "SPECIAL_ASPARAGUS",
    title: "전설의 정원사",
    description: "아이템 없이 성검 아스파라거스를 키웠다.",
    iconUrl: "Sparkles",
    earned: true,
    active: false,
    unlockedAt: "2026-04-04T05:05:00.000Z",
  },
  {
    code: "ASPARAGUS_GARDENER",
    title: "정원사",
    description: "성검 아스파라거스를 키웠다.",
    iconUrl: "Sprout",
    earned: false,
    active: false,
    unlockedAt: null,
  },
  {
    code: "THANK_YOU_ALL",
    title: "Who Made This?!",
    description: "엔딩 크레딧을 끝까지 봤다.",
    iconUrl: "Clapperboard",
    earned: true,
    active: false,
    unlockedAt: "2026-04-01T09:20:00.000Z",
  },
  {
    code: "WHO_ARE_YOU",
    title: "어?",
    description: "???예요.",
    iconUrl: "KeyRound",
    earned: true,
    active: true,
    unlockedAt: "2026-04-02T05:10:00.000Z",
  },
  {
    code: "RICO_DEBUT_DATE",
    title: "관리자 권한에 접근한 자",
    description: "정답은 리코 데뷔 날짜였습니다~",
    iconUrl: "Eye",
    earned: true,
    active: false,
    unlockedAt: "2026-03-31T12:00:00.000Z",
  },
  {
    code: "LUCKY_RICO_MOMENT",
    title: "행운과 함께",
    description: "오늘의 리코 운세에서 대길을 뽑았다!",
    iconUrl: "ScrollText",
    earned: false,
    active: false,
    unlockedAt: null,
  },
  {
    code: "LEGEND-HERO",
    title: "레전드 용사",
    description: "마왕 토벌을 끝마쳤다.",
    iconUrl: "Sword",
    earned: false,
    active: false,
    unlockedAt: null,
  },
  {
    code: "FIRST_PUZZLE",
    title: "퍼즐 첫 완성",
    description: "퍼즐놀이를 처음으로 완성했다!",
    iconUrl: "Puzzle",
    earned: false,
    active: false,
    unlockedAt: null,
  },
  {
    code: "R-GEND-HERO",
    title: "R전드 용사",
    description: "레전드보다 R전드가 좋은거죠?",
    iconUrl: "Crown",
    earned: false,
    active: false,
    unlockedAt: null,
  },
  {
    code: "LOST_IN_THE_WAY",
    title: "길을 잃었다~",
    description: "어딜 가야 할까~",
    iconUrl: "FileQuestionMark",
    earned: false,
    active: false,
    unlockedAt: null,
  },
];

const maskAchievementText = (text: string) => text.replace(/[^\s.]/g, "?");

type Tone = "mint" | "warm" | "cool";

const TONE_STYLES: Record<Tone, string> = {
  mint:
    "bg-[linear-gradient(180deg,#f7fff9_0%,#e8fff2_50%,#dff9ff_100%)] text-[#114a50]",
  warm:
    "bg-[linear-gradient(180deg,#fff8ef_0%,#ffeeda_50%,#ffe3d2_100%)] text-[#4d3022]",
  cool:
    "bg-[linear-gradient(180deg,#f7fbff_0%,#edf4ff_50%,#e6f0ff_100%)] text-[#16325d]",
};

export default function AchievementListShowcase() {
  const [tone, setTone] = useState<Tone>("mint");

  const sorted = useMemo(
    () =>
      [...SAMPLE_ACHIEVEMENTS].sort((a, b) => {
        if (a.earned !== b.earned) {
          return a.earned ? -1 : 1;
        }
        if (a.active !== b.active) {
          return a.active ? -1 : 1;
        }
        const aUnlocked = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const bUnlocked = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        return bUnlocked - aUnlocked;
      }),
    [],
  );

  return (
    <main className={`min-h-screen ${TONE_STYLES[tone]} transition-colors`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 md:px-10 md:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">
              Sample
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] md:text-5xl">
              Achievement List
            </h1>
            <p className="mt-2 text-sm font-medium opacity-70 md:text-base">
              업적 카드의 아이콘, 색상, 마스킹, 정렬 우선순위를 한 화면에서
              비교합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(["mint", "warm", "cool"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTone(value)}
                className={`rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.2em] transition md:text-sm ${
                  tone === value
                    ? "border-current bg-black/10"
                    : "border-current/30 bg-white/55 hover:bg-white/80"
                }`}
              >
                {value}
              </button>
            ))}
            <Link
              to="/lobby"
              className="rounded-full border border-current/30 bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] hover:bg-white/85 md:text-sm"
            >
              Lobby
            </Link>
          </div>
        </header>

        <section className="grid gap-4 rounded-[1.6rem] border border-current/15 bg-white/65 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm md:grid-cols-3 md:p-5">
          <div className="rounded-2xl border border-current/15 bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
              Earned
            </p>
            <p className="mt-2 text-2xl font-black">
              {sorted.filter((item) => item.earned).length}
            </p>
          </div>
          <div className="rounded-2xl border border-current/15 bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
              Locked
            </p>
            <p className="mt-2 text-2xl font-black">
              {sorted.filter((item) => !item.earned).length}
            </p>
          </div>
          <div className="rounded-2xl border border-current/15 bg-white/65 p-4">
            <p className="text-xs font-black uppercase tracking-[0.22em] opacity-70">
              Active
            </p>
            <p className="mt-2 text-2xl font-black">
              {sorted.find((item) => item.active)?.title ?? "None"}
            </p>
          </div>
        </section>

        <section className="grid gap-3">
          {sorted.map((achievement) =>
            achievement.earned ? (
              <article
                key={achievement.code}
                className={`flex items-center gap-4 rounded-[1.4rem] border bg-white/75 p-4 shadow-[0_14px_30px_rgba(0,0,0,0.06)] transition ${
                  achievement.active
                    ? "border-[#5EC7A5] ring-2 ring-[#5EC7A5]/25"
                    : "border-[#5EC7A5]/30"
                }`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#5EC7A5] bg-[#f6fffb] text-[#166D77]">
                  <AchievementIcon
                    code={achievement.code}
                    iconUrl={achievement.iconUrl}
                    size={30}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="truncate text-lg font-black">
                      {achievement.title}
                    </h2>
                    {achievement.active && (
                      <span className="rounded-full bg-[#5EC7A5] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium opacity-75">
                    {achievement.description}
                  </p>
                </div>
              </article>
            ) : (
              <article
                key={achievement.code}
                className="flex items-center gap-4 rounded-[1.4rem] border border-[#d0d4d8]/70 bg-[#f1f4f6]/90 p-4 opacity-80"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#d0d4d8] bg-[#e6eaed] text-[#9aa1a8]">
                  <AppIcon name="Lock" size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-black text-[#88929b]">
                    {maskAchievementText(achievement.title)}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-[#9aa1a8]">
                    {maskAchievementText(achievement.description)}
                  </p>
                </div>
              </article>
            ),
          )}
        </section>
      </div>
    </main>
  );
}
