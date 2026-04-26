const GAME_META = {
  "/game/cody": {
    gameName: "리코의 외출 준비",
    image: "/assets/codygame/share_thumbnail.jpg",
  },
  "/game/adventure": {
    gameName: "용사 리코 이야기 1",
    image: "/assets/adventuregame/share_thumbnail.jpg",
  },
  "/game/puzzle": {
    gameName: "퍼즐 게임",
    image: "/assets/puzzlegame/share_thumbnail.jpg",
  },
  "/game/asparagus": {
    gameName: "아스파라거스 키우기",
    image: "/assets/asparagus/share_thumbnail.jpg",
  },
};

const SITE_NAME = "유즈하 리코 생일카페";

export default async function handler(request, context) {
  const url = new URL(request.url);
  const path = url.pathname;

  const matched = Object.keys(GAME_META).find(
    (k) => path === k || path.startsWith(k + "/"),
  );
  if (!matched) return context.next();

  const meta = GAME_META[matched];
  const response = await context.next();
  const html = await response.text();

  const rawScore = url.searchParams.get("score");
  const score = rawScore && /^\d+$/.test(rawScore) ? rawScore : null;

  const scorePart = score ? ` - ${score} 점` : "";
  const title = `${meta.gameName}${scorePart} — ${SITE_NAME}`;
  const imageUrl = `${url.origin}${meta.image}`;
  const pageUrl = `${url.origin}${path}`;

  const twitterTags = [
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
    `<meta property="og:url" content="${pageUrl}" />`,
  ].join("\n    ");

  const modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${title}" />`,
    )
    .replace(
      /<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${imageUrl}" />`,
    )
    .replace("</head>", `    ${twitterTags}\n  </head>`);

  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");

  return new Response(modified, {
    headers,
    status: response.status,
  });
}
