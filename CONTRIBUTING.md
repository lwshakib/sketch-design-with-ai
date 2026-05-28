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
- **pnpm**: Latest (Recommended)
- **PostgreSQL**: v14+
- **Git**
- **Cloudflare AI Gateway API Key**: [Get one here](https://developers.cloudflare.com/ai-gateway/)

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
   pnpm install
   ```
2. **Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `DATABASE_URL`, `GEMINI_API_KEY`, and `BETTER_AUTH_SECRET`.
3. **Database & Storage Initialization**:
   ```bash
   pnpm db:migrate
   pnpm bucket:setup
   ```
   _Note: `db:migrate` generates the Prisma client into `./generated/prisma`._

### Running the App

Start the Next.js development server:

```bash
pnpm dev
```

## 🏗️ Technical Architecture

### AI Credit System

The project implements a daily credit limit (10 credits) per user.

- **Logic**: Found in `lib/credits.ts`.
- **Testing**: To reset your credits during development, you can manually update the `lastCreditReset` field in the `User` table to a previous date using Prisma Studio (`pnpm db:studio`).

### Server-Sent Events (SSE) Stream

AI generation and real-time status updates are pushed directly to the UI using a direct Server-Sent Events (SSE) stream.

- **Route**: Check `app/api/chat/route.ts` for the SSE streaming and LLM tool execution logic.
- **Canvas Integration**: The spatial UI updates and theme colors are painted in real time as the SSE events stream from the server.

### Prisma Configuration

We use a custom output directory for the Prisma Client to avoid issues with some deployment environments.

- **Generator**: Defined in `prisma/schema.prisma` with `output = "../generated/prisma"`.
- **Usage**: Import the client from `@/lib/prisma` which points to the correctly generated location.

## 📝 Coding Standards

- **TypeScript**: Mandatory for all logic. Use strict typing.
- **React**: Use Functional Components and Hooks (React 19).
- **Canvas**: Use `@xyflow/react` for spatial UI logic.
- **Styling**: Tailwind CSS 4 only. Use the `cn()` utility for conditional classes.
- **API**: Follow the standard response format `{ success: boolean, data?: any, error?: string }`.

## 📝 Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope): ...`
- `fix(scope): ...`
- `docs: ...`
- `refactor: ...`

## 🧪 Testing Guidelines

Currently, the project is prioritizing feature stability. New core logic should be manually tested against the dev environment before submission.

Please make sure to run the following validation scripts locally before opening a pull request:

- **Code formatting**: `pnpm run format:check` (or `pnpm run format` to auto-fix styling)
- **ESLint Linting**: `pnpm run lint`
- **TypeScript Typechecking**: `pnpm run typecheck`
- **Production Compilation**: `pnpm run build`

Automated testing suites (Vitest/Playwright) are planned for future milestones.

## 🙏 Thank You!

Your contributions make this project better for everyone. Happy coding! 🎉
