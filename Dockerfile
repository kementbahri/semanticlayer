# Use Microsoft's Playwright image for pre-installed browsers
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Environment variables
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/cli/package.json ./packages/cli/
COPY packages/mcp-server/package.json ./packages/mcp-server/
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm turbo run build

# Playwright cleanup
RUN npx playwright install-deps

# Expose port (default for Railway/Render/Fly.io)
EXPOSE 3100
ENV PORT=3100
ENV NODE_ENV=production

# Start the server (serves both API and Web)
CMD ["pnpm", "start", "--filter", "@semanticlayer/api-server"]
