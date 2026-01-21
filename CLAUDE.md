# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Axon** is a desktop application forked from [Dive](https://github.com/OpenAgentPlatform/Dive), an open-source MCP (Model Context Protocol) Host that integrates with LLMs supporting function calling.

**Key Differences from Dive:**
- Project name: Axon (not Dive)
- Custom features and modifications built on top of Dive
- Independent development while maintaining Dive's core architecture

**Fork Relationship:**
```
Upstream: OpenAgentPlatform/Dive (original)
↓
This repo: Your Axon fork (customized)
```

## Development Commands

```bash
# Install dependencies
npm install
cd mcp-host && uv sync && cd ..   # Setup Python MCP host

# Development
npm run dev                        # Start Electron dev server
npm run dev:tauri                  # Start Tauri dev (requires cargo tauri dev)

# Code quality
npm run lint                       # ESLint
npm run check                      # TypeScript type checking
npm run check-i18n                 # Verify i18n translation files

# Build
npm run build:electron             # Build Electron app
npm run package                    # Create distribution package
npm run package:windows            # Windows NSIS installer
npm run package:darwin             # macOS DMG
npm run package:linux              # Linux AppImage
```

## Architecture

**Dual Desktop Framework:**
- `electron/` - Electron main process (stable, all platforms)
- `src-tauri/` - Tauri Rust backend (modern alternative, Windows/Linux)

**Frontend (React + TypeScript):**
- `src/atoms/` - Jotai state management (configState, interfaceState, chatState, toolState)
- `src/components/` - Reusable UI components
- `src/views/` - Page-level components (Chat, Setup, Welcome, Login)
- `src/ipc/` - Electron IPC communication layer
- `src/locales/` - i18n translations (24+ languages)

**Backend Integration:**
- `mcp-host/` - Git submodule (Python MCP host for running MCP servers)
- `packages/core-js/` - Native Rust bindings via NAPI-rs

**Key Technologies:**
- React 18 + Vite + TypeScript
- Jotai for state management
- Multiple LLM SDKs: Anthropic, OpenAI, Mistral, AWS Bedrock, Ollama
- MCP SDK for Model Context Protocol integration

## Development Configuration

In dev mode, configuration files are stored in `.config/` (not user home):
- `.config/mcp_config.json` - MCP server configuration
- `.config/model_config.json` - LLM model settings
- `.config/command_alias.json` - Command aliases

## Platform-Specific Notes

- **Windows**: Binaries (Node, Python, UV) auto-downloaded; use `npm run download:windows-bin` for cross-platform builds
- **macOS**: Requires manual Python/Node.js installation
- **Linux**: May need `--no-sandbox` or `chmod +x` for AppImage

## Axon-Specific Development Guidelines

### When Modifying Code

- Document any changes that diverge from upstream Dive
- Consider upstream compatibility for future merges
- Use clear commit messages: `feat(axon):`, `fix(axon):`, etc.
- Prefix Axon-specific changes with clear markers in code comments

### Documentation

- Axon-specific documentation: See `README.md` in this repo
- DIVE-specific documentation: See `README_Dive.md` in this repo
- Official Dive documentation: https://github.com/OpenAgentPlatform/Dive
- This document: `CLAUDE.md`

## Important Notes for Claude Code

⚠️ **This is a fork of Dive**:
- When searching for documentation, check this repo's `docs/` folder first
- Dive's official docs may not reflect Axon customizations
- Check Axon technical documentation
- Always consider upstream compatibility when making architectural changes

