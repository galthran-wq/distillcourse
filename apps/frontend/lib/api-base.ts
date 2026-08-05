// Same origin on purpose: caddy serves the site and /api/* from one host, and
// `next dev` rewrites /api the same way (next.config.ts). Everything the
// browser calls builds its path from here, so moving the prefix — backend
// API_V1_STR, the caddy handler, the rewrite — is one edit on this side too.
export const API = "/api/v1";
