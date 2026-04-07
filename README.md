<div align="center">

#  SemanticLayer

**AI-Optimized Web Content Protocol & Extraction Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-≥20-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[![SemanticLayer Demo](semantic-search.PNG)](https://semantic-layer.depiar.com)

*Extract clean, token-efficient content from any web page — including React, Vue, Angular, and Svelte SPAs.*

[Protocol Spec](packages/protocol-spec/spec.md) · [Getting Started](#getting-started) · [CLI Usage](#cli-usage) · [MCP Server](#mcp-server) · [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

AI agents and LLM-powered tools waste **60–80% of tokens** on HTML boilerplate when reading web pages. Modern SPAs (React, Next.js, Vue, Nuxt, Angular, Svelte) make it worse — a simple HTTP fetch returns an empty `<div id="root"></div>`.

**Existing solutions** are either static reading lists (`llms.txt`) or proprietary SaaS products (Jina Reader, Firecrawl). There is no **open protocol** and no **self-hostable engine** that handles the full spectrum of the modern web.

## The Solution

SemanticLayer is two things:

1. **An Open Protocol** — Websites publish `/.well-known/semanticlayer.json` to serve AI-optimized content natively. No browser rendering needed.
2. **An Extraction Engine** — For sites that don't implement the protocol, SemanticLayer uses Playwright to render SPAs, extract the main content, and return it in clean Markdown or SLML format.

```text
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   AI Agent   │────▶│    SemanticLayer    │────▶│  Any Website │
│  (LLM/IDE)   │◀────│ Protocol + Renderer │◀────│ (SPA or not) │
└──────────────┘     └─────────────────────┘     └──────────────┘
                                │
                  ┌─────────────┴────────────┐
                  │ 70-80% fewer tokens      │
                  │ SPA rendering built-in   │
                  │ Open protocol standard   │
                  └──────────────────────────┘
```

## Features

-  **Universal Rendering** — Handles React, Next.js, Vue, Nuxt, Angular, Svelte, SvelteKit, Gatsby, Remix, Astro, and static HTML
-  **Token Efficient** — 70–80% token reduction via intelligent content extraction
-  **Open Protocol** — Websites can serve AI-optimized content natively via `/.well-known/semanticlayer.json`
-  **Multiple Formats** — Markdown, SLML (SemanticLayer Markup Language), JSON, plain text
-  **Content Modes** — `content` (main only), `structured` (+ metadata), `full` (entire page), `raw` (rendered HTML)
-  **MCP Server** — Plug into Cursor, VS Code, or any MCP-compatible AI tool
-  **Docker Ready** — Self-host with a single `docker compose up`
-  **Dual-Path Architecture** — Protocol-native sites get instant responses (~200ms), others go through the render pipeline (~2–5s)

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

### Installation

```bash
###  Deployment (Live Demo)

SemanticLayer is designed to be easily deployed as a monorepo. The server handles both the API and the static web client.

**Option 1: VPS / Plesk (Docker)**
Use the provided `Dockerfile` to deploy on a Linux VPS. This handles the Playwright dependencies that often fail on legacy servers (like CentOS 7).

1. Clone and enter directory:
   ```bash
   git clone https://github.com/kementbahri/semanticlayer.git .
   ```
2. Build the Docker image:
   ```bash
   docker build -t semanticlayer .
   ```
3. Run the container:
   ```bash
   docker run -d -p 3100:3100 --name semantic-app --restart always semanticlayer
   ```
4. Set up a **Reverse Proxy** in Plesk (Domains > Docker Proxy Rules) to map your domain to port `3100`.

**Option 2: Cloud Platforms (Railway / Render)**
1. Connect your GitHub repository.
2. It will automatically detect the `Dockerfile`.
3. Set the `PORT` environment variable to `3100`.

**Option 3: GitHub Codespaces**
Anyone can run a private instance by clicking **Code > Open with Codespaces**.

---

###  Live Demo Setup
Once deployed, the web interface will be accessible at your domain. AI agents can also interact directly with the `/api/extract` endpoint.

```bash
# Example remote extraction
curl -X POST https://your-demo-url.com/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com", "mode":"full"}'
```

# Clone the repository
git clone https://github.com/kementbahri/semanticlayer.git
cd semanticlayer

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Build all packages
pnpm build
```

### Quick Test

```bash
# Extract content from a React SPA
node packages/cli/bin/semanticlayer.js extract https://react.dev/learn

# Output as SLML format
node packages/cli/bin/semanticlayer.js extract https://react.dev/learn --format slml

# With metadata summary
node packages/cli/bin/semanticlayer.js extract https://react.dev/learn --meta

# Save to file
node packages/cli/bin/semanticlayer.js extract https://vuejs.org/guide/introduction --output vue-guide.md
```

## CLI Usage

```
semanticlayer <command> [options]

Commands:
  extract <url>    Extract AI-optimized content from a URL
  discover <url>   Discover pages and protocol support for a website
  check <url>      Check if a website supports the SemanticLayer protocol

Extract Options:
  -m, --mode <mode>        content | structured | full | raw  (default: content)
  -f, --format <format>    markdown | slml | json | text      (default: markdown)
  -o, --output <file>      Write output to a file
  -t, --timeout <ms>       Navigation timeout                 (default: 30000)
  -w, --wait <strategy>    load | domcontentloaded | networkidle (default: networkidle)
  --meta                   Print metadata summary to stderr
  --headful                Run browser in visible mode
  --no-images              Exclude image references
  --no-links               Exclude link references
```

### Examples

```bash
# Main content only (smallest output)
sl extract https://angular.dev/overview --mode content

# Content + navigation + metadata
sl extract https://svelte.dev/docs/introduction --mode structured --format slml

# Full page including header/footer (scripts removed)
sl extract https://astro.build/blog --mode full

# JSON output with all metadata
sl extract https://nuxt.com/docs/getting-started --format json --meta

# Check protocol support
sl check https://example.com

# Discover site structure via sitemap
sl discover https://react.dev
```

## MCP Server

Use SemanticLayer directly from your AI-powered IDE.

### Cursor / VS Code Setup

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "semanticlayer": {
      "command": "node",
      "args": ["/path/to/semanticlayer/packages/mcp-server/dist/index.js"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `extract_web_content` | Extract clean content from any URL with mode and format options |
| `discover_site` | Discover site structure and protocol support |
| `check_protocol` | Check if a site implements the SemanticLayer protocol |

## Protocol

Websites can implement the SemanticLayer protocol to serve AI-optimized content without browser rendering.

### 1. Publish a Discovery Document

Create `/.well-known/semanticlayer.json`:

```json
{
  "version": "1.0",
  "name": "My Documentation",
  "description": "API docs for MyFramework",
  "endpoints": {
    "content": "/api/sl/content"
  },
  "supportedModes": ["content", "structured"],
  "languages": ["en"]
}
```

### 2. Implement the Content Endpoint

Return content in the requested format:

```json
{
  "sl_version": "1.0",
  "url": "https://example.com/docs/start",
  "title": "Getting Started",
  "content": "# Getting Started\n\nInstall with npm...",
  "metadata": {
    "wordCount": 800,
    "estimatedTokens": 1200,
    "language": "en"
  }
}
```

See the full [Protocol Specification](packages/protocol-spec/spec.md) for details.

## SLML Format

SLML (SemanticLayer Markup Language) extends Markdown with semantic blocks:

```slml
---slml
url: https://example.com/docs
title: API Reference
tokens: ~2400
---

# API Reference

Use the `create()` function to initialize:

@code[javascript]
import { create } from 'example';
const app = create({ debug: true });
@/code

@nav[hidden]
- Home -> /
- Guides -> /guides
- API -> /api
@/nav

@link-group[Related]
- Getting Started -> /docs/start
- Configuration -> /docs/config
@/link-group
```

## Architecture

```
Request → Protocol Check → ┬→ Fast Path (protocol-native, ~200ms)
                           └→ Render Path:
                                Playwright → Hydration Wait → DOM Extract → Format → Response
                                                                              (~2-5s)
```

The dual-path design creates a flywheel: as more sites adopt the protocol, more requests take the fast path, making the system faster and cheaper.

## Docker

```bash
cd docker
docker compose up --build
```

## Supported Frameworks

| Framework | Detection | Rendering |
|-----------|-----------|-----------|
| React     | ✅        | ✅        |
| Next.js   | ✅        | ✅        |
| Vue       | ✅        | ✅        |
| Nuxt      | ✅        | ✅        |
| Angular   | ✅        | ✅        |
| Svelte    | ✅        | ✅        |
| SvelteKit | ✅        | ✅        |
| Gatsby    | ✅        | ✅        |
| Remix     | ✅        | ✅        |
| Astro     | ✅        | ✅        |
| Static HTML | ✅      | ✅        |

## Project Structure

```
packages/
  core/            Core extraction engine (Playwright, Readability, formatters)
  cli/             Command-line interface
  mcp-server/      MCP server for IDE integration
  protocol-spec/   Protocol specification and JSON schemas
docker/            Docker configuration
.github/           CI workflows and templates
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Bahri Kement](https://github.com/kementbahri)
