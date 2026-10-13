# CLAUDE.md

## Project context

This repo holds materials for a workshop on **local AI**: language models running directly on developers' laptops rather than via cloud APIs.

- **Audience:** fullstack developers, mostly Java/Kotlin (Spring Boot) with some TypeScript/React.
- **Primary focus (first iteration):** local AI as a *coding assistant*. Show where local models shine, and be honest about where they don't.
- **Goal of the demo project:** a small, realistic codebase that participants recognise from their day job, used to show local coding assistance live.

## Demo project

<!-- TODO: fill in once the demo project is chosen -->
- Name / purpose: Local_AI_workshop / showcase coding assistance using local ai running on laptop
- Location in repo: demo1
- How to run: from intellij og command line
- What each workshop exercise demonstrates: 
    1. Inline completion
    2. Chat on selected code
    3. Agentic coding. Finding a bug that cuts across severeal layers

## Tech conventions

- Backend: Kotlin, Spring Boot (WebFlux / Reactor Netty where reactive is relevant).
- Frontend: TypeScript + React.
- Prefer idiomatic Kotlin over Java-style Kotlin.
- Keep examples small enough to read on a projector; favour clarity over cleverness.
- The demo must run fully offline on a laptop. Don't add dependencies on cloud AI APIs.

## Local model terminology

Use consistent terms in code, docs and slides:

- **GGUF** files (llama.cpp ecosystem) encode quantization in the filename, e.g. `.Q4_K_M.gguf`.
- **MLX** (Apple Silicon) models use a different notation for the same slots, e.g. `-4bit-mlx`.
- A model filename breaks down into: base name, parameter size, fine-tune variant, version tag, quantization, file format.
- Version tags: minor bumps (v0.1 → v0.2) usually mean incremental improvements; major jumps signal architecture or training changes.

## Presentation diagrams

Diagrams are generated with Python + matplotlib and must match the dark slide theme:

- 16:9 aspect ratio, black background, white text.
- Set `fig.patch.set_facecolor("black")` and `ax.set_facecolor("black")`.
- Always pass `facecolor="black"` to `plt.savefig()`. It defaults back to white otherwise.
- For connector lines that would cross a row of cards, use a stepped path routed above/below the card band instead of diagonals or straight vertical drops.

## Working style

- Explain non-obvious choices briefly in comments; the code doubles as teaching material.
- When suggesting changes, keep the workshop audience in mind: experienced developers, new to local AI.
