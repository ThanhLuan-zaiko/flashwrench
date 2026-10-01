# Stage 1: Install dependencies (caching layer)
FROM oven/bun:1-debian AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build Next.js
FROM oven/bun:1-debian AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# A dummy variable for instrumentation to avoid connecting to ScyllaDB during the build process.
ENV SCYLLA_CONTACT_POINTS="build-dummy"
ENV SCYLLA_PORT="9042"
ENV SCYLLA_LOCAL_DATACENTER="datacenter1"
ENV SCYLLA_SKIP_CONNECTION_CHECK="true"
ENV NEXT_TELEMETRY_DISABLED="1"

RUN bun run build

# Stage 3: Production image (smallest image with only necessary files)
FROM oven/bun:1-debian AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED="1"

# The base image ships a non-root `bun` user (uid/gid 1000); the slim
# variant carries no addgroup/adduser, so reuse it instead of adding one.

# Runtime upload directory (physical image files, see docs/media.md).
# Mount a persistent volume here in production
# (docker -v flashwrench-storage:/app/storage); without a mount the
# directory is ephemeral to the container filesystem.
RUN mkdir -p /app/storage/uploads && chown bun:bun /app/storage

COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static
COPY --from=builder --chown=bun:bun /app/public ./public
# Be Vietnam Pro, read at request time by the invoice PDF renderer
# (lib/pdf/pdf-fonts.ts). Without this the standalone image has no font and
# every Vietnamese invoice fails to render.
COPY --from=builder --chown=bun:bun /app/asset/fonts ./asset/fonts

USER bun

EXPOSE 3000

ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "server.js"]