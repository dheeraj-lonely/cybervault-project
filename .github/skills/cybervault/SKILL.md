---
name: cybervault-project
description: 'Use this skill when working on the CyberVault project. It emphasizes secure-by-default implementation, privacy-aware data handling, and validation before completion.'
---

# CyberVault Project

Treat this repository as a security-first project that may store, process, or protect sensitive data. Follow the project habits below whenever you inspect, modify, explain, or test code.

## Project Working Rules

- Prefer secure defaults over convenience.
- Keep sensitive values out of source files, logs, tests, and screenshots.
- Make changes narrow and easy to review.
- When you add configuration or environment variables, document the purpose and defaults.
- Validate behavior with the lightest relevant proof, such as a focused test, a run command, or a static check.

## Recommended Workflow

1. Understand the request and identify the affected files.
2. Trace the existing data flow before changing behavior.
3. Implement the smallest secure fix that matches the request.
4. Verify the change with workspace evidence or a focused test.
5. Report the result with the exact evidence that changed the decision.

## Security Expectations

- Do not hardcode secrets, API keys, tokens, passwords, or private endpoints.
- Do not log protected data or include debugging output that reveals credentials.
- Prefer least-privilege access patterns and explicit validation.
- Keep data transformations deterministic and auditable when possible.

## Validation Expectations

When a task touches application behavior, run the most direct validation available:

- Unit or integration tests if they exist.
- A focused smoke command or script reproducible from the workspace.
- A syntax or lint check when the change is structural.

## Repository Guidance

Use the repository README as the source of truth for the current project context. Keep new skill instructions aligned with the repository's purpose rather than inventing a new architecture.
