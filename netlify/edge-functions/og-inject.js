const GAME_META = {
  "/game/cody": {
    title: "리코의 외출 준비 — 유즈하 리코 생일카페",
    image: "/assets/codygame/share_thumbnail.jpg",
  },
  "/game/adventure": {
    title: "용사 리코 이야기 1 — 유즈하 리코 생일카페",
    image: "/assets/adventuregame/share_thumbnail.jpg",
  },
  "/game/puzzle": {
    title: "퍼즐 게임 — 유즈하 리코 생일카페",
    image: "/assets/puzzlegame/share_thumbnail.jpg",
  },
  "/game/asparagus": {
    title: "아스파라거스 키우기 — 유즈하 리코 생일카페",
    image: "/assets/asparagus/share_thumbnail.jpg",
  },
};

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

  const imageUrl = `${url.origin}${meta.image}`;

  const modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${meta.title}" />`,
    )
    .replace(
      /<meta property="og:image"[^>]*>/,
      `<meta property="og:image" content="${imageUrl}" />`,
    );

  return new Response(modified, {
    headers: response.headers,
    status: response.status,
  });
}
