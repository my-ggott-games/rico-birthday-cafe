const PRODUCTION_SITE_URL = "https://riko-birthday-cafe.netlify.app";

export const SITE_BASE_URL: string =
  typeof window !== "undefined" ? window.location.origin : PRODUCTION_SITE_URL;
