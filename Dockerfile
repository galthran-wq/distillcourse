FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
# CONTENT_PREVIEW=1 renders drafted+reviewed lessons (personal staging).
# Build with --build-arg CONTENT_PREVIEW=0 for the public published-only site.
ARG CONTENT_PREVIEW=1
ENV CONTENT_PREVIEW=$CONTENT_PREVIEW
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Invalid content must never deploy: validate before building.
RUN npm run validate && npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ARG CONTENT_PREVIEW=1
ENV CONTENT_PREVIEW=$CONTENT_PREVIEW
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Safety fallback only: all pages are statically generated at build time and
# nothing reads content/ at runtime today.
COPY --from=build /app/content ./content
EXPOSE 3000
CMD ["node", "server.js"]
