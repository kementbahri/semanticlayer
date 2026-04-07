# Microsoft Playwright image (Includes Node.js and all browser dependencies)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Create app directory
WORKDIR /app

# Install pnpm correctly
RUN npm install -g pnpm

# Copy project files
COPY . .

# Install dependencies and build monorepo
RUN pnpm install
RUN pnpm build

# Expose port (default for Railway/Render/Fly.io)
EXPOSE 3100
ENV PORT=3100
ENV NODE_ENV=production

# Start the server directly via Node.js for maximum stability in Docker
CMD ["node", "apps/server/dist/index.js"]
