# Build context is the REPO ROOT, not this directory:
#   docker build -f apps/frontend/Dockerfile .
# The image needs content/, which lives at the repo root next to apps/.
# The runtime stage below is alpine — it receives only built JS.
FROM node:22-slim AS deps
WORKDIR /app/apps/frontend
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

FROM node:22-slim AS build
WORKDIR /app/apps/frontend
# CONTENT_PREVIEW=1 renders drafted+reviewed lessons (personal staging).
# Build with --build-arg CONTENT_PREVIEW=0 for the public published-only site.
ARG CONTENT_PREVIEW=1
ENV CONTENT_PREVIEW=$CONTENT_PREVIEW
# The origin the prerendered Markdown twins and their <link rel="alternate">
# name the site by (lib/content/site.ts); compose passes FRONTEND_HOST.
ARG SITE_URL=https://distillcourse.com
ENV SITE_URL=$SITE_URL
COPY --from=deps /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend ./
COPY content /app/content
# Invalid content must never deploy: validate before building. The labs are
# the one part checked outside the image — `make deploy` executes them on the
# host before this build starts, so the image needs no uv.
RUN npm run validate -- --no-labs && npm run build

FROM node:22-alpine AS run
# The repo layout is preserved inside the image (app under /app/apps/frontend,
# content at /app/content): the app resolves content/ two levels above its own
# working directory.
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ARG CONTENT_PREVIEW=1
ENV CONTENT_PREVIEW=$CONTENT_PREVIEW
COPY --from=build /app/apps/frontend/.next/standalone ./
COPY --from=build /app/apps/frontend/.next/static ./.next/static
COPY --from=build /app/apps/frontend/public ./public
# Safety fallback only: all pages are statically generated at build time and
# nothing reads content/ at runtime today.
COPY --from=build /app/content /app/content
EXPOSE 3000
CMD ["node", "server.js"]
