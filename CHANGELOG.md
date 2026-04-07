# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-07

### Added

- Initial release
- Core extraction engine with Playwright-based SPA rendering
- Support for React, Next.js, Vue, Nuxt, Angular, Svelte, SvelteKit, Gatsby, Remix, Astro
- Content modes: `content`, `structured`, `full`, `raw`
- Output formats: Markdown, SLML, JSON, Plain Text
- SemanticLayer Protocol specification v1.0 (draft)
- Protocol discovery via `/.well-known/semanticlayer.json`
- CLI tool with `extract`, `discover`, and `check` commands
- MCP server for IDE integration (Cursor, VS Code, etc.)
- Docker support
- GitHub Actions CI pipeline
