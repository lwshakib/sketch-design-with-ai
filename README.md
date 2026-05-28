# <img src="public/logo.svg" width="32" alt="Sketch Logo" /> Sketch - Design with AI

> Build high-fidelity design systems and UI screens using the power of Agentic AI.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC)](https://tailwindcss.com/)

## 🚀 Overview

**Sketch** is an intelligent AI-powered design tool that transforms your ideas into reality. Whether you're a developer needing a quick UI mockup or a designer iterating on concepts, this tool empowers you to:

- 🎨 **Text-to-Design**: Describe your idea in natural language and watch the AI generate multi-screen design systems.
- 🖼️ **Theme Prototyping**: Automatically establish a consistent design system (colors, typography) before generating functional screens.
- 🤖 **Agentic Design Generation**: Leverages Kimi K2.5 (via Cloudflare AI Gateway) for high-fidelity HTML/CSS production.
- 👁️ **Infinite Canvas**: Manage your entire project visually on an infinite spatial workspace powered by React Flow.
- ⚡ **Inngest Realtime**: Watch your designs come to life with live status updates pushed directly to the UI.
- 💻 **Code Export**: Get production-ready, clean code (Tailwind HTML/CSS) instantly.
- 💳 **Credit System**: Managed project-based credit allowance for sustainable AI generations.

## 🏗️ Architecture

```mermaid
graph TD
    User([User])
    subgraph Client ["Client Side (Next.js 16)"]
        UI[User Interface]
        Canvas[Infinite Canvas / React Flow]
        Realtime[Inngest Realtime Status]
    end

    subgraph Server ["Server Side (Next.js API & Inngest)"]
        Auth[Better Auth]
        InngestAPI[Inngest Background Workers]
        ProjectAPI[Project & Credits Logic]
        AIService[AI Service Gateway]
    end

    subgraph Services ["External Services"]
        Gateway[Cloudflare AI Gateway]
        Kimi[Kimi K2.5 Model]
        InngestCloud[Inngest Event Bus]
        S3Storage[AWS S3 / R2 Storage]
    end

    subgraph Data ["Data Layer"]
        DB[(PostgreSQL)]
        Prisma[Prisma ORM 7.2]
    end

    User -->|Interacts| UI
    UI -->|Manages Canvas| Canvas
    UI -->|Authenticates| Auth
    UI -->|API Requests| ProjectAPI

    InngestCloud -.->|Realtime Updates| Realtime

    ProjectAPI -->|CRUD| DB
    ProjectAPI -->|Trigger Generation| InngestCloud

    InngestCloud -->|Execute Workflow| InngestAPI
    InngestAPI -->|Tool Calling| AIService
    AIService -->|Stream/Generate| Gateway
    Gateway -->|Inference| Kimi
    InngestAPI -->|Consume Credit| DB
    InngestAPI -->|Persist Design| DB

    Auth -->|Session Management| DB
    InngestAPI -->|Store Assets| S3Storage
```

<div align="center">
  <img src="public/app_demo/light_demo.png" alt="Sketch Light Mode" width="49%" />
  <img src="public/app_demo/dark_demo.png" alt="Sketch Dark Mode" width="49%" />
</div>

## ✨ Key Features

### Design Creation

- **Prompt Interface**: Robust text input for describing complex UI requirements
- **Image Upload**: Upload screenshots, mood boards, or existing sketches for reference
- **Interactive Canvas**: Intuitive drawing tools for manual adjustments
- **Multi-Frame Workspace**: Work on multiple design variations simultaneously

### AI Capabilities

- **Smart Design Generation**: Highly precise design generation using Kimi K2.5.
- **Theme Orchestration**: Decoupled theme generation to ensure visual consistency across all project screens.
- **Infinite Spatial Workspace**: Organize screens and themes on a zoomable React Flow canvas.
- **Inngest Realtime**: Live progress tracking for every generation step.
- **Code Export**: Get clean, production-ready HTML and CSS.
- **Responsive Previews**: Immediate visualization of mobile and web outputs.

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

| Category       | Technologies                                                                                                                                                     |
| :------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | [Next.js 16.1](https://nextjs.org/), [React 19](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/), [Tailwind CSS 4](https://tailwindcss.com/) |
| **Canvas**     | [@xyflow/react](https://reactflow.dev/) (React Flow)                                                                                                             |
| **Animation**  | [Framer Motion 12](https://www.framer.com/motion/), [Motion](https://motion.dev/)                                                                                |
| **Components** | [Radix UI](https://www.radix-ui.com/)                                                                                                                            |
| **Backend**    | [Better Auth 1.4](https://www.better-auth.com/), [Inngest 3.5](https://www.inngest.com/)                                                                         |
| **Database**   | [PostgreSQL](https://www.postgresql.org/), [Prisma ORM 7.2](https://www.prisma.io/)                                                                              |
| **AI**         | [Kimi K2.5](https://www.moonshot.cn/) via [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)                                                 |
| **Utilities**  | [Zustand](https://zustand-demo.pmnd.rs/), [tokenlens](https://github.com/infera-ai/tokenlens)                                                                    |
| **Storage**    | [AWS S3](https://aws.amazon.com/s3/) (or compatible R2/Minio)                                                                                                    |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or higher ([Download](https://nodejs.org/))
- **pnpm**: Latest version ([Install](https://pnpm.io/))
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
pnpm install
```

### 3. Environment Setup

Create a `.env` file and fill in the required variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sketch_db"

# Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# Better Auth
BETTER_AUTH_SECRET="your_generated_secret"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Media Storage (S3 / R2)
AWS_REGION="auto"
AWS_ENDPOINT="your_s3_endpoint"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_S3_BUCKET_NAME="your_bucket_name"

# Email (Resend)
RESEND_API_KEY="your_resend_api_key"

# Public Config
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 4. Database & Storage Setup

```bash
# Generate the Prisma client & run migrations
pnpm db:migrate

# Setup S3 bucket CORS and policies (optional script)
pnpm bucket:setup
```

### 5. Start the Services

You need both the Inngest dev server and the Next.js dev server running:

```bash
# Terminal 1: Inngest Dev Server
pnpm exec inngest-cli@latest dev

# Terminal 2: Next.js App
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to start designing.

## 📁 Project Structure

- `app/`: Next.js App Router (Pages, API, and Server Actions)
- `components/`: UI components (Radix, Canvas, Editor)
- `inngest/`: Background job definitions & realtime status logic
- `services/`: AI Gateway service and S3 storage service
- `lib/`: Shared utilities, auth logic, and credit management
- `prisma/`: Database schema and configuration
- `generated/`: Generated Prisma Client (ignored by git)
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
3. Ensure the `postinstall` script runs `pnpm db:generate`.

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
