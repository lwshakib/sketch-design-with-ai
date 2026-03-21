# <img src="public/logo.svg" width="32" alt="Sketch Logo" /> Sketch - Design with AI

> Transform your sketches into stunning, production-ready designs using the power of AI.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)

## 🚀 Overview

**Sketch** is an intelligent AI-powered design tool that transforms your ideas into reality. Whether you're a developer needing a quick UI mockup or a designer iterating on concepts, this tool empowers you to:

- 🎨 **Text-to-Design**: Describe your idea in plain text and watch it come to life
- 📸 **Screenshot-to-Code**: Upload a screenshot or wireframe to generate editable code
- ✏️ **Sketch Integration**: Use the canvas to draw and iterate on concepts manually
- 🤖 **AI-Powered Design**: Leverage Google Gemini 2.0 Flash AI to transform sketches into modern, aesthetically pleasing designs
- 👁️ **Instant Preview**: See your design evolve in real-time with instant rendering and live project thumbnails
- 🎭 **Variations & Iteration**: Generate multiple design variations with automated retry logic for high-fidelity results
- 💻 **Export to Code**: Get production-ready code (HTML/React/CSS) instantly
- 📱 **Responsive Design**: Generate designs that work seamlessly across all device sizes with mobile-first previews
- 💳 **Credit System**: Managed daily allowance for AI generations to ensure sustainable usage

## 🏗️ Architecture

```mermaid
graph TD
    User([User])
    subgraph Client ["Client Side (Next.js 16)"]
        UI[User Interface]
        Canvas[Infinite Canvas]
        Preview[Real-time Preview]
    end

    subgraph Server ["Server Side (Next.js API & Inngest)"]
        Auth[Better Auth]
        InngestAPI[Inngest Background Jobs]
        ProjectAPI[Project & Credits API]
        LLM[LLM Integration Layer]
    end

    subgraph Services ["External Services"]
        Gemini[Google Gemini 2.0 Flash]
        InngestCloud[Inngest Event Bus]
        Cloudinary[Cloudinary Media]
    end

    subgraph Data ["Data Layer"]
        DB[(PostgreSQL)]
        Prisma[Prisma ORM 7.2]
    end

    User -->|Interacts| UI
    UI -->|Draws/Edits| Canvas
    UI -->|Authenticates| Auth
    UI -->|API Requests| ProjectAPI

    ProjectAPI -->|CRUD| DB
    ProjectAPI -->|Check Credits| DB
    ProjectAPI -->|Trigger Generation| InngestCloud

    InngestCloud -->|Execute Function| InngestAPI
    InngestAPI -->|Stream Generation| Gemini
    InngestAPI -->|Consume Credit| DB
    InngestAPI -->|Persist Design| DB

    Auth -->|Persist Session| DB
    Canvas -->|Upload Assets| Cloudinary
```

## 🎬 App Demos

<div align="center">
  <p align="center">
    <img src="public/app_demo/dark_demo.png" alt="Sketch Dark Mode" width="100%" />
  </p>
  <p align="center">
    <em>Dark Mode: A sleek, professional workspace for your AI design iterations.</em>
  </p>
  
  <br/>

  <p align="center">
    <img src="public/app_demo/light_demo.png" alt="Sketch Light Mode" width="100%" />
  </p>
  <p align="center">
    <em>Light Mode: Clean, vibrant, and focused interface for maximum productivity.</em>
  </p>
</div>

## ✨ Key Features

### Design Creation

- **Prompt Interface**: Robust text input for describing complex UI requirements
- **Image Upload**: Upload screenshots, mood boards, or existing sketches for reference
- **Interactive Canvas**: Intuitive drawing tools for manual adjustments
- **Multi-Frame Workspace**: Work on multiple design variations simultaneously

### AI Capabilities

- **Smart Design Generation**: AI understands context and generates pixel-perfect designs using Gemini 2.0 Flash
- **Design Variations**: Create multiple visual explorations from a single prompt or screen
- **Auto-Retry & Validation**: Intelligent system that retries generation if output is incomplete or faulty
- **Theme Application**: Automatically apply consistent themes across your designs
- **Code Export**: Get clean, production-ready HTML, CSS, and React code
- **Responsive Previews**: View designs in Mobile, Tablet, and Desktop modes with live sidebar thumbnails

### Managed Ecosystem

- **Credit System**: Users receive 10 daily credits (resets at 12 AM) to power AI generations
- **User Authentication**: Secure login with Better Auth (OAuth & Credentials)
- **Project Organization**: Create and manage multiple design projects with infinite canvas
- **Version History**: Track all design iterations through persistent message history
- **Cloud Storage**: All projects and designs saved to PostgreSQL database via Prisma

### Developer Experience

- **Modern Tech Stack**: Built with Next.js 16 (App Router), React 19, and TypeScript 5
- **Tailwind CSS 4**: Utilizing the latest in styling technology for high performance
- **Inngest Integration**: Robust background job processing for long-running AI tasks
- **Code Editor**: Integrated code viewer with syntax highlighting (Shiki/CodeMirror)
- **Export Options**: Download designs as HTML, images, or ZIP files

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16.1](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Animation** | [Framer Motion 12](https://www.framer.com/motion/), [Motion](https://motion.dev/) |
| **Components** | [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **Backend** | [Better Auth 1.4](https://www.better-auth.com/), [Inngest 3.5](https://www.inngest.com/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM 7.2](https://www.prisma.io/) |
| **AI** | [Google Gemini 2.0 Flash](https://ai.google.dev/) via [Vercel AI SDK](https://sdk.vercel.ai/) |
| **Utilities** | [Zustand](https://zustand-demo.pmnd.rs/), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| **Media** | [Cloudinary](https://cloudinary.com/), [html2canvas](https://html2canvas.hertzen.com/) |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or higher ([Download](https://nodejs.org/))
- **Bun**: Latest version ([Install](https://bun.sh/))
- **PostgreSQL**: v14 or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control ([Download](https://git-scm.com/))

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/lwshakib/sketch-design-with-ai.git
cd sketch-design-with-ai
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create a `.env` file and fill in the required variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sketch_wireframe_db"

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"

# Better Auth
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudinary (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### 4. Database Initialization

```bash
# Generate the Prisma client & run migrations
bun run db:migrate
```

### 5. Start the Services

You need both the Inngest dev server and the Next.js dev server running:

```bash
# Terminal 1: Inngest Dev Server
bun run inngest

# Terminal 2: Next.js App
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to start designing.

## 📁 Project Structure

- `app/`: Next.js App Router (Pages & API Routes)
- `components/`: UI components (Radix/Shadcn)
- `inngest/`: Background job definitions & workflow logic
- `llm/`: AI integration, prompts, and tool configurations
- `lib/`: Shared utilities, auth logic, and credit management
- `prisma/`: Database schema and migrations
- `hooks/`: Custom React hooks for global state and UI logic
- `public/`: Static assets and icons

## 🎯 Usage Guide

1. **Dashboard**: Manage your projects or start a new one.
2. **Infinite Canvas**: Drag, zoom, and organize your design frames.
3. **AI Chat**: Interact with the AI to generate new screens or modify existing ones.
4. **Toolbox**: Use traditional drawing tools to guide the AI with sketches.
5. **Credits**: Monitor your daily usage (10 credits/day) in the user menu.
6. **Export**: Get your code as HTML/CSS/React or as a PNG image.

## 🚀 Deployment

### Vercel Deployment

1. Set up a PostgreSQL database (e.g., Neon or Supabase).
2. Configure environment variables in Vercel.
3. Ensure the `postinstall` script runs `bun run db:generate`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lwshakib/sketch-design-with-ai)

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start
1. Fork the repo
2. Create your branch: `git checkout -b feat/my-new-feature`
3. Commit your changes: `git commit -m 'feat: add some cool feature'`
4. Push to the branch: `git push origin feat/my-new-feature`
5. Open a Pull Request

## 📜 Code of Conduct

Everyone participating in this project is expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [lwshakib](https://github.com/lwshakib)**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/lwshakib/sketch-design-with-ai/issues) · [Request Feature](https://github.com/lwshakib/sketch-design-with-ai/issues)

</div>
