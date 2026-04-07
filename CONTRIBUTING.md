# Contributing to SemanticLayer

Thank you for your interest in contributing! SemanticLayer is an open-source
project and we welcome contributions of all kinds.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/kementbahri/semanticlayer.git
cd semanticlayer

# Install dependencies
pnpm install

# Install Playwright browsers
npx playwright install chromium

# Build all packages
pnpm build

# Run the CLI locally
node packages/cli/bin/semanticlayer.js extract https://example.com
```

## Project Structure

```
packages/
  core/          Core extraction engine
  cli/           Command-line interface
  mcp-server/    MCP server for IDE integration
  protocol-spec/ Protocol specification and schemas
```

## Making Changes

1. Fork the repository and create a feature branch
2. Make your changes with clear, descriptive commits
3. Ensure `pnpm typecheck` passes with no errors
4. Ensure `pnpm build` completes successfully
5. Open a pull request against `main`

## Code Style

- TypeScript strict mode is enforced
- Use explicit types over `any`
- Prefer early returns over nested conditions
- Keep functions focused and under 50 lines where possible
- No unnecessary comments — code should be self-documenting

## Reporting Issues

Use GitHub Issues with one of the provided templates:
- **Bug Report** — for broken behavior
- **Feature Request** — for new ideas

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.
