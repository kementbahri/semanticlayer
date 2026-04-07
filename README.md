# SemanticLayer AI Protocol (SLML) 

**SemanticLayer** is a high-performance, open-source protocol and proxy service designed for AI agents. It transforms regular web content into **SLML (SemanticLayer Markup Language)**—a markdown-based format optimized for token efficiency and semantic clarity.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/protocol-v0.1.0-orange.svg)](#slml-specification)

---

##  Features

*   **Dual-Path Extraction:**
    *   **Native Path:** Fetches pre-optimized SLML directly if the site supports the protocol.
    *   **Render Path:** Uses Playwright for SPA/Hydration support (React, Next.js, etc.).
*   **Token Optimization:** Reducing HTML noise by up to 90% while preserving context.
*   **AI-Specific Blocks:** `@nav`, `@meta`, `@code`, and `@link-group` blocks for IDE integration.
*   **Monorepo Architecture:** Clean, modular, and ready for deployment.

---

## 🛠 Project Structure

```text
/
├── apps/
│   ├── web/          # React + Vite Landing & Live Demo UI
│   └── server/       # Fastify API Gateway & Static Server
├── packages/
│   ├── core/         # The extraction & formatting engine
│   ├── cli/          # Command-line tool (@semanticlayer/cli)
│   └── mcp-server/   # AI MCP Server (Cursor/VSCode/Windsurf)
└── Dockerfile         # Production-ready deployment config
```

---

##  Getting Started

###  Installation

To run it locally for development:

```bash
# Clone the repository
git clone https://github.com/kementbahri/semanticlayer.git
cd semanticlayer

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development servers
pnpm dev
```

###  Deployment (Live Demo)

SemanticLayer is designed to be easily deployed. The server handles both the API and the static web client.

**Option 1: Railway / Render (Docker)**
Use the provided `Dockerfile` to deploy a container with Playwright pre-installed.
1. Create a [Railway](https://railway.app) account and connect this repo.
2. It detects the `Dockerfile` automatically.
3. Expose port `3100`.

**Option 2: GitHub Codespaces**
Click **"Open in Codespaces"** on GitHub to run a dedicated instance for free.

---

##  SLML Specification

SLML (SemanticLayer Markup Language) is the backbone of the protocol. It looks like standard Markdown but includes semantic blocks for AI agents:

```markdown
---slml
url: https://example.com/blog/ai
title: The Future of Agents
tokens: ~450/3000 (Savings 85%)
---

@meta
description: An in-depth look at AI agents.
keywords: AI, Agents, LLM
@/meta

# The Future of Agents
This is the main content...

@code[python]
print("Hello AI World")
@/code

@link-group[Related]
- [Next Part](/blog/part2)
@/link-group
```

---

## 🤝 Contributing

Contributions are welcome! Pull requests, bug reports, and suggestions are all appreciated. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 👤 Author

Developed by **Bahri Kement** ([@kementbahri](https://github.com/kementbahri))

## ⚖ License

MIT © [Bahri Kement](https://github.com/kementbahri)
