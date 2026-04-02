export const LOBBY_BGM_SRC = encodeURI("/sound/감자튀김 옴뇸뇸.m4a");

export const ACTIVITY_BGM_SOURCES = [
  encodeURI("/sound/밤바밤바.m4a"),
  encodeURI("/sound/그 날, 감자튀김.m4a"),
] as const;

export const pickRandomActivityBgm = () =>
  ACTIVITY_BGM_SOURCES[
    Math.floor(Math.random() * ACTIVITY_BGM_SOURCES.length)
  ];
