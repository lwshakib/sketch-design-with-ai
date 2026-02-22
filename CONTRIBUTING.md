# <img src="public/logo.svg" width="32" alt="Sketch Logo" /> Contributing to Sketch - Design with AI

First off, **thank you** for considering contributing to Sketch! It's people like you that make this AI-powered design tool amazing. We welcome contributions from everyone, whether you're fixing a typo, reporting a bug, or implementing a major feature.

This document provides guidelines for contributing to the project. Following these guidelines helps communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [lwshakib@gmail.com](mailto:lwshakib@gmail.com).

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18.17 or higher)
- **Bun** (recommended) or npm/pnpm/yarn
- **PostgreSQL** (v14 or higher)
- **Git** for version control
- A **GitHub account**
- Basic knowledge of **TypeScript**, **React**, and **Next.js**

### Fork and Clone

1. **Fork the repository** on GitHub by clicking the "Fork" button
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sketch-design-with-ai.git
   cd sketch-design-with-ai
   ```
3. **Add upstream remote** to keep your fork in sync:
   ```bash
   git remote add upstream https://github.com/lwshakib/sketch-design-with-ai.git
   ```

## 🤝 How Can I Contribute?

### Reporting Bugs

Bugs are tracked as [GitHub issues](https://github.com/lwshakib/sketch-design-with-ai/issues). Before creating a bug report, please check existing issues to avoid duplicates.

#### How to Submit a Good Bug Report

Create an issue and provide the following information:

- **Use a clear and descriptive title** for the issue
- **Describe the exact steps to reproduce the problem** in as much detail as possible
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** after following the steps
- **Explain which behavior you expected to see instead** and why
- **Include screenshots or animated GIFs** if possible
- **Include your environment details**:
  - OS and version
  - Node.js version
  - Browser and version
  - Any relevant console errors

#### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. 20.10.0]
- Version: [e.g. 0.1.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are also tracked as [GitHub issues](https://github.com/lwshakib/sketch-design-with-ai/issues).

#### How to Submit a Good Enhancement Suggestion

- **Use a clear and descriptive title** for the issue
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most users
- **List some examples** of how it would be used
- **Include mockups or examples** if applicable

#### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- **Good First Issue** - issues labeled `good first issue` are great for newcomers
- **Help Wanted** - issues labeled `help wanted` need attention

### Pull Requests

#### Before Submitting a Pull Request

1. **Check existing PRs** to avoid duplicates
2. **Discuss major changes** in an issue first
3. **Follow the coding standards** outlined below
4. **Test your changes** thoroughly
5. **Update documentation** if needed

#### Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** following our coding standards

3. **Commit your changes** using conventional commits:

   ```bash
   git commit -m "feat: add amazing feature"
   ```

4. **Keep your branch up to date** with upstream:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

5. **Push to your fork**:

   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request** on GitHub with:
   - Clear title describing the change
   - Detailed description of what changed and why
   - Reference to related issues (e.g., "Fixes #123")
   - Screenshots/GIFs for UI changes

#### Pull Request Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues

Fixes #(issue number)

## How Has This Been Tested?

Describe the tests you ran to verify your changes.

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes thoroughly
```

## 🛠️ Development Setup

### Initial Setup

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   ```

   Then fill in your API keys and database URL in `.env`

3. **Set up the database**:

   ```bash
   bun run db:migrate
   ```

4. **Start the Inngest Dev Server**:

   ```bash
   npx --ignore-scripts=false inngest-cli@latest dev
   ```

5. **Start the development server**:

   ```bash
   bun dev
   ```

6. **Build for production**:

   ```bash
   bun run build
   ```

7. **Open** [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

```bash
# Development
bun dev              # Start dev server with hot reload
bun run build        # Build for production
bun start            # Start production server
bun lint             # Run ESLint

# Inngest
npx inngest-cli dev  # Start Inngest dev server

# Database
bun run db:generate  # Generate Prisma Client
bun run db:migrate   # Run database migrations
bun run db:studio    # Open Prisma Studio GUI
bun run db:reset     # Reset database (⚠️ destructive)
```

## 📝 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Enable strict mode** - no `any` types unless absolutely necessary
- **Define interfaces** for all data structures
- **Use type inference** where possible

### React/Next.js

- **Use functional components** with hooks
- **Follow React best practices**:
  - Keep components small and focused
  - Use custom hooks for reusable logic
  - Memoize expensive computations with `useMemo`
  - Use `useCallback` for event handlers passed to children
- **Use Next.js App Router** conventions
- **Server Components by default**, use Client Components only when needed

### File Naming

- **Components**: PascalCase (e.g., `UserMenu.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)

### Code Style

- **Use Prettier** for formatting (configured in the project)
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** at the end of statements
- **Trailing commas** in multi-line objects/arrays
- **Max line length**: 100 characters

### Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 4. Hooks
  const [state, setState] = useState(false);

  // 5. Event handlers
  const handleClick = () => {
    setState(true);
    onAction();
  };

  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Click me</Button>
    </div>
  );
}
```

### CSS/Styling

- **Use Tailwind CSS** for styling
- **Follow mobile-first** approach
- **Use CSS variables** for theming
- **Avoid inline styles** unless dynamic
- **Use `cn()` utility** for conditional classes

### Database

- **Use Prisma** for all database operations
- **Write migrations** for schema changes
- **Use transactions** for related operations
- **Index frequently queried fields**

### API Routes

- **Validate input** using Zod or similar
- **Handle errors** gracefully
- **Return consistent response format**:

  ```typescript
  // Success
  { success: true, data: {...} }

  // Error
  { success: false, error: "Error message" }
  ```

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
feat(canvas): add undo/redo functionality
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): simplify chat endpoint logic
perf(rendering): optimize frame rendering performance
test(auth): add unit tests for login flow
chore(deps): update dependencies
```

## 🧪 Testing Guidelines

### Writing Tests

- **Write tests** for all new features
- **Update tests** when modifying existing code
- **Test edge cases** and error conditions
- **Use descriptive test names**

### Test Structure

```typescript
describe("ComponentName", () => {
  it("should render correctly", () => {
    // Test implementation
  });

  it("should handle user interaction", () => {
    // Test implementation
  });

  it("should handle errors gracefully", () => {
    // Test implementation
  });
});
```

## 📚 Documentation

### Code Documentation

- **Add JSDoc comments** for complex functions
- **Document props** for components
- **Explain "why"** not just "what"
- **Keep comments up to date**

### README Updates

- Update README if you add/change features
- Keep installation instructions current
- Add examples for new functionality

## 👥 Community

### Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bugs and feature requests
- **Email**: [lwshakib@gmail.com](mailto:lwshakib@gmail.com)

### Recognition

Contributors are recognized in:

- GitHub contributors page
- Release notes for significant contributions
- README acknowledgments section

## 🎯 Best Practices

### General

- **Keep PRs focused** - one feature/fix per PR
- **Write clear commit messages** following conventions
- **Test thoroughly** before submitting
- **Be responsive** to feedback and review comments
- **Be patient** - reviews may take time

### Code Review

When reviewing others' code:

- **Be constructive** and respectful
- **Explain your suggestions** with reasoning
- **Approve** when satisfied or request changes clearly
- **Test the changes** if possible

### Communication

- **Be clear and concise** in issues and PRs
- **Provide context** for your changes
- **Ask questions** if something is unclear
- **Be respectful** of others' time and effort

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

If you have any questions or need help, don't hesitate to reach out:

- **GitHub**: [@lwshakib](https://github.com/lwshakib)
- **Email**: [lwshakib@gmail.com](mailto:lwshakib@gmail.com)

---

**Happy Contributing! 🎉**
