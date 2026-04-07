# SemanticLayer Protocol Specification v1.0

> **Status:** Draft
> **Author:** Bahri Kement
> **Date:** 2026-04-07

## Overview

The SemanticLayer Protocol is an open standard that enables websites to serve
AI-optimized content directly, without requiring headless browser rendering.
Sites that implement this protocol provide a discovery document and a content
endpoint that returns clean, structured data ready for LLM consumption.

## Discovery

A conforming site MUST publish a JSON document at:

```
/.well-known/semanticlayer.json
```

### Discovery Schema

```json
{
  "version": "1.0",
  "name": "string (required) — Human-readable site name",
  "description": "string (required) — Brief site description",
  "defaultFormat": "markdown | slml | json | text",
  "endpoints": {
    "content": "string (required) — Path to content endpoint",
    "sitemap": "string (optional) — Path to sitemap endpoint",
    "search": "string (optional) — Path to search endpoint"
  },
  "supportedModes": ["content", "structured", "full"],
  "languages": ["en"],
  "rateLimit": {
    "requestsPerMinute": 60,
    "burst": 10
  }
}
```

## Content Endpoint

The content endpoint accepts GET requests with these query parameters:

| Parameter | Type   | Default     | Description                        |
|-----------|--------|-------------|------------------------------------|
| `path`    | string | `/`         | Page path to extract               |
| `mode`    | string | `content`   | `content`, `structured`, `full`, `raw` |
| `format`  | string | Configured  | `markdown`, `slml`, `json`, `text` |

### Response Format

```json
{
  "sl_version": "1.0",
  "url": "https://example.com/page",
  "title": "Page Title",
  "content": "# Heading\n\nContent in requested format...",
  "metadata": {
    "wordCount": 1200,
    "estimatedTokens": 1800,
    "language": "en",
    "lastModified": "2026-04-01T10:00:00Z"
  }
}
```

## SLML Format

SLML (SemanticLayer Markup Language) extends Markdown with:

1. **Frontmatter header** with URL, title, and token estimate
2. **Semantic blocks** using `@block[options]` / `@/block` syntax
3. **Visibility control** via `[hidden]` / `[visible]` attributes

### Semantic Blocks

| Block          | Description                         |
|----------------|-------------------------------------|
| `@nav`         | Navigation links                    |
| `@meta`        | Page metadata (description, etc.)   |
| `@link-group`  | Grouped related links               |
| `@code`        | Code block with language annotation |
| `@table`       | Data table                          |
| `@img`         | Image with alt text and caption     |

### Example

```slml
---slml
url: https://example.com/docs/start
title: Getting Started
tokens: ~1200
---

# Getting Started

Install the package:

@code[bash]
npm install example
@/code

@nav[hidden]
- Home -> /
- Docs -> /docs
@/nav
```

## Compliance Levels

- **Level 1 (Minimum):** Discovery document + content endpoint returning Markdown
- **Level 2 (Recommended):** Level 1 + SLML support + sitemap endpoint
- **Level 3 (Full):** Level 2 + search endpoint + multilingual support

## Implementation Guide

See `examples/protocol-implementation/` for reference implementations in:
- Express.js
- Next.js API Routes
- FastAPI (Python)
- Go net/http
