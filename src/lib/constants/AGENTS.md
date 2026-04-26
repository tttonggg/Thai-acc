<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src/lib/constants

## Purpose

Application-wide constants and configurations for error messages, Thai accounting rules, and system-wide values.

## Parent Reference
<!-- Parent: ../AGENTS.md -->

## Key Files

| File | Description |
|------|-------------|
| `error-messages.ts` | Standardized Thai/English error messages |

## For AI Agents

- Error messages from `error-messages.ts` should be used in API routes
- Thai accounting constants (tax rates, SSC rules) also in `constants/`
- Do NOT create new constants files — add to existing ones