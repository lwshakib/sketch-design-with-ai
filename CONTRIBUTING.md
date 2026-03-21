# <img src="public/logo.svg" width="32" alt="Sketch Logo" /> Contributing to Sketch - Design with AI

First off, **thank you** for considering contributing to Sketch! We welcome contributions from everyone, whether you're fixing a typo, reporting a bug, or implementing a major feature.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Technical Architecture](#technical-architecture)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## 📜 Code of Conduct

Everyone participating in this project is governed by our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.17+
- **Bun**: Latest (Recommended)
- **PostgreSQL**: v14+
- **Git**
- **Google Gemini API Key**: [Get one here](https://makersuite.google.com/app/apikey)

### Fork and Clone

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sketch-design-with-ai.git
   cd sketch-design-with-ai
   ```

## 🛠️ Development Setup

### Initial Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```
2. **Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, and `BETTER_AUTH_SECRET`.
3. **Database Initialization**:
   ```bash
   bun run db:migrate
   ```
   *Note: This generates the Prisma client into `./generated/prisma`.*

### Running the App

1. **Start Inngest Dev Server** (Required for AI features):
   ```bash
   bun run inngest
   ```
2. **Start Next.js**:
   ```bash
   bun dev
   ```

## 🏗️ Technical Architecture

### AI Credit System
The project implements a daily credit limit (10 credits) per user.
- **Logic**: Found in `lib/credits.ts`.
- **Testing**: To reset your credits during development, you can manually update the `lastCreditReset` field in the `User` table to a previous date using Prisma Studio (`bun run db:studio`).

### Inngest Workflows
AI generation is handled asynchronously via Inngest to support streaming, multi-step retries, and background processing.
- **Files**: Check the `inngest/` directory for function definitions.
- **Execution**: The `chat` API route triggers Inngest events which then call the LLM tools.

### Prisma Configuration
We use a custom output directory for the Prisma Client to avoid issues with some deployment environments.
- **Generator**: Defined in `prisma/schema.prisma` with `output = "../generated/prisma"`.
- **Usage**: Import the client from `@/lib/prisma` which points to the correctly generated location.

## 📝 Coding Standards

- **TypeScript**: Mandatory for all logic. Use strict typing.
- **React**: Use Functional Components and Hooks.
- **Styling**: Tailwind CSS 4 only. Use the `cn()` utility for conditional classes.
- **API**: Follow the standard response format `{ success: boolean, data?: any, error?: string }`.

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): ...`
- `fix(scope): ...`
- `docs: ...`
- `refactor: ...`

## 🧪 Testing Guidelines

- **Unit Tests**: Use Jest (`bun test`).
- **E2E Tests**: Use Playwright (`bun run test:e2e`).
- **New Features**: Must include relevant tests to ensure stability.

## 🙏 Thank You!

Your contributions make this project better for everyone. Happy coding! 🎉
