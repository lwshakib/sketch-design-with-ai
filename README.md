# Sketch - Design with AI 🎨✨

> Transform your sketches into stunning, production-ready designs using the power of AI.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748)](https://www.prisma.io/)

## 🚀 Overview

**Sketch** is an intelligent AI-powered design tool that transforms your ideas into reality. Whether you're a developer needing a quick UI mockup or a designer iterating on concepts, this tool empowers you to:

- 🎨 **Text-to-Design**: Describe your idea in plain text and watch it come to life
- 📸 **Screenshot-to-Code**: Upload a screenshot or wireframe to generate editable code
- ✏️ **Sketch Integration**: Use the canvas to draw and iterate on concepts manually
- 🤖 **AI-Powered Design**: Leverage Google Gemini AI to transform sketches into modern, aesthetically pleasing designs
- 👁️ **Instant Preview**: See your design evolve in real-time with instant rendering
- 💻 **Export to Code**: Get production-ready code (HTML/React/CSS) instantly
- 🎭 **Theme Customization**: Apply and customize themes with glassmorphism, dark mode, and vibrant color palettes
- 📱 **Responsive Design**: Generate designs that work seamlessly across all device sizes

## 🏗️ Architecture

```mermaid
graph TD
    User([User])
    subgraph Client ["Client Side (Next.js)"]
        UI[User Interface]
        Canvas[Infinite Canvas]
    end
    
    subgraph Server ["Server Side (Next.js API Routes)"]
        Auth[Better Auth]
        InngestAPI[Inngest Functions]
        ProjectAPI[Project API]
    end
    
    subgraph Services ["External Services"]
        Gemini[Google Gemini AI]
        InngestCloud[Inngest Dev Server / Cloud]
    end
    
    subgraph Data ["Data Layer"]
        DB[(PostgreSQL)]
    end

    User -->|Interacts| UI
    UI -->|Draws/Edits| Canvas
    UI -->|Authenticates| Auth
    UI -->|API Requests| ProjectAPI
    
    ProjectAPI -->|CRUD| DB
    ProjectAPI -->|Trigger Event| InngestCloud
    
    InngestCloud -->|Execute Function| InngestAPI
    InngestAPI -->|Generate Content| Gemini
    InngestAPI -->|Store Result| DB
    
    Auth -->|Persist Session| DB
```

## 📸 Screenshots

<div align="center">
  <h3>Light Mode</h3>
  <img src="public/light.png" alt="Light Mode" width="100%" />
  <img src="public/light1.png" alt="Editor Light Mode" width="100%" />
  <br/><br/>
  
  <h3>Dark Mode</h3>
  <img src="public/dark.png" alt="Dark Mode" width="100%" />
  <img src="public/dark1.png" alt="Editor Dark Mode" width="100%" />
  <br/><br/>


</div>

## ✨ Key Features

### Design Creation
- **Prompt Interface**: Robust text input for describing complex UI requirements
- **Image Upload**: Upload screenshots, mood boards, or existing sketches for reference
- **Interactive Canvas**: Intuitive drawing tools for manual adjustments
- **Multi-Frame Workspace**: Work on multiple design variations simultaneously

### AI Capabilities
- **Smart Design Generation**: AI understands context and generates pixel-perfect designs
- **Theme Application**: Automatically apply consistent themes across your designs
- **Code Export**: Get clean, production-ready HTML, CSS, and React code
- **Responsive Previews**: View designs in Mobile, Tablet, and Desktop modes

### Project Management
- **User Authentication**: Secure login with Better Auth
- **Project Organization**: Create and manage multiple design projects
- **Version History**: Track all design iterations through message history
- **Cloud Storage**: All projects saved to PostgreSQL database

### Developer Experience
- **Modern Tech Stack**: Built with Next.js 16, React 19, and TypeScript
- **Component Library**: Extensive UI components with Radix UI
- **Code Editor**: Monaco Editor integration for code viewing/editing
- **Export Options**: Download designs as HTML, images, or ZIP files

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16.1](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **UI Library**: [React 19.2](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + Vanilla CSS
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/)
- **Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)

### Backend & Database
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM 7.2](https://www.prisma.io/)
- **Authentication**: [Better Auth 1.4](https://www.better-auth.com/)
- **AI Integration**: [Google AI SDK](https://ai.google.dev/) with Gemini 2.5 Flash

### Additional Tools
- **Canvas**: HTML5 Canvas API
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Image Processing**: [html2canvas](https://html2canvas.hertzen.com/)
- **File Handling**: [JSZip](https://stuk.github.io/jszip/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.17 or higher ([Download](https://nodejs.org/))
- **Bun**: Latest version ([Install](https://bun.sh/)) or npm/pnpm/yarn
- **PostgreSQL**: v14 or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control ([Download](https://git-scm.com/))

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/lwshakib/sketch-design-with-ai.git
cd sketch-design-with-ai
```

### 2. Install Dependencies

Using Bun (recommended):
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory. You can start by copying the example file:

```bash
cp .env.example .env
```

Then fill in the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sketch_wireframe_db"

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key_here"

# Better Auth
BETTER_AUTH_SECRET="your_secret_key_here"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudinary (Optional - for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

**Getting API Keys:**
- **Google Gemini API**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Cloudinary** (Optional): Sign up at [Cloudinary](https://cloudinary.com/) for image hosting

### 4. Database Setup

Initialize and migrate the database:

```bash
# Generate Prisma Client
bun run db:generate

# Run database migrations
bun run db:migrate

# (Optional) Open Prisma Studio to view your database
bun run db:studio
```

### 5. Run the Inngest Dev Server

In a separate terminal, run the Inngest dev server to handle background jobs and AI generation:

```bash
bun run inngest
```

This will start the Inngest dashboard at [http://localhost:8288](http://localhost:8288).

### 6. Run the Development Server

In another terminal, run the Next.js development server:

```bash
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
sketch-design-with-ai/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages
│   ├── api/                 # API routes
│   │   ├── chat/           # AI chat endpoint
│   │   └── projects/       # Project CRUD operations
│   ├── project/            # Project workspace
│   │   └── [projectId]/    # Dynamic project page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── logo.tsx            # App logo
│   ├── user-menu.tsx       # User menu
│   └── ...                 # Other components
├── context/                 # React Context providers
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
│   ├── artifact-renderer.ts # Design rendering logic
│   ├── auth.ts             # Authentication utilities
│   └── utils.ts            # General utilities
├── llm/                     # AI/LLM configuration
│   ├── model.ts            # AI model configuration
│   └── prompts.ts          # AI prompt templates
├── prisma/                  # Database schema & migrations
│   └── schema.prisma       # Prisma schema
├── public/                  # Static assets
├── .env                     # Environment variables (gitignored)
├── package.json            # Dependencies
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Usage Guide

### Creating Your First Design

1. **Sign Up/Login**: Create an account or sign in
2. **Create Project**: Click "New Project" on the dashboard
3. **Sketch Your Idea**: Use the canvas to sketch your UI concept
4. **AI Generation**: 
   - Type a prompt describing your design (e.g., "Create a modern landing page with hero section")
   - Or upload a sketch image
   - Click "Generate Design"
5. **Review & Iterate**: The AI will generate a design. Chat with it to refine
6. **Export**: Download as HTML, view code, or export as image

### Working with Themes

1. Select a design frame
2. Click the theme icon in the toolbar
3. Choose from preset themes or let AI generate a custom theme
4. Apply theme to see instant updates

### Exporting Designs

- **View Code**: Click the code icon to see HTML/CSS
- **Export HTML**: Download as a complete HTML file
- **Export Image**: Save as PNG using html2canvas
- **Export ZIP**: Get all project files in a ZIP archive

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models:

- **User**: User accounts with authentication
- **Session**: User sessions for Better Auth
- **Account**: OAuth and credential accounts
- **Project**: Design projects with canvas data
- **Message**: AI chat messages with design artifacts

See `prisma/schema.prisma` for the complete schema.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/lwshakib/sketch-design-with-ai)

### Database Hosting

For production, use a managed PostgreSQL service:
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Supabase](https://supabase.com/)
- [Neon](https://neon.tech/)
- [Railway](https://railway.app/)

## 📜 Available Scripts

```bash
# Development
bun run inngest      # Start Inngest dev server
bun dev              # Start dev server
bun build            # Build for production
bun start            # Start production server
bun lint             # Run ESLint

# Database
bun run db:generate  # Generate Prisma Client
bun run db:migrate   # Run migrations
bun run db:studio    # Open Prisma Studio
bun run db:reset     # Reset database (⚠️ destructive)
```

## 🤝 Contributing

We love contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Code of Conduct

Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand the standards we expect from our community.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for powerful AI capabilities
- [Vercel](https://vercel.com/) for Next.js and hosting
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- All our amazing [contributors](https://github.com/lwshakib/sketch-design-with-ai/graphs/contributors)

## 📧 Contact & Support

- **Author**: Shakib Khan ([@lwshakib](https://github.com/lwshakib))
- **Email**: lwshakib@gmail.com
- **Issues**: [GitHub Issues](https://github.com/lwshakib/sketch-design-with-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/lwshakib/sketch-design-with-ai/discussions)

## 🗺️ Roadmap

- [ ] Real-time collaboration
- [ ] More AI model options (Claude, GPT-4)
- [ ] Component library export
- [ ] Figma plugin integration
- [ ] Version control for designs
- [ ] Team workspaces
- [ ] Advanced theme editor
- [ ] Mobile app

---

<div align="center">

**Built with ❤️ by [lwshakib](https://github.com/lwshakib)**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/lwshakib/sketch-design-with-ai/issues) · [Request Feature](https://github.com/lwshakib/sketch-design-with-ai/issues) · [Documentation](https://github.com/lwshakib/sketch-design-with-ai/wiki)

</div>
