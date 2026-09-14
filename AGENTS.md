# AGENTS.md - Mobile Vehicle Repair Booking Web App

## 1. Project Overview
This is a fullstack web application for booking mobile vehicle repair services. Users can book on-demand mechanics, track service status, and manage their vehicle maintenance history. The system must be highly responsive, fast, and optimized for both desktop and mobile experiences.

## 2. Core Technology Stack
- **Runtime & Package Manager:** Bun (Use `bun install`, `bun run`, `bun add`, etc. Do NOT use npm or yarn).
- **Framework:** Next.js (App Router).
- **Language:** TypeScript (Strict mode enabled).
- **Database:** ScyllaDB (Use CQL - Cassandra Query Language).
- **Styling:** Tailwind CSS (Strictly pure Tailwind, NO custom CSS files).
- **Data Fetching & State:** TanStack Query (React Query).
- **UI Components:** Headless UI / Radix UI (styled exclusively with Tailwind).
- **Icons:** `react-icons` ONLY. Never hand-write inline `<svg>` for UI icons; always import from `react-icons` (e.g., `react-icons/fi`).

---

## 3. STRICT CODEBASE CONSTRAINTS (CRITICAL)
To maintain high code quality, readability, and modularity, the following file size limits are **STRICTLY ENFORCED**. 

### 3.1. File Size Limits
- **`.tsx` files (React Components):** MUST NOT exceed **250 lines**.
- **`.ts` files (Logic, Utils, Types, API):** MUST NOT exceed **350 lines**.

### 3.2. Modularization Rules
If a file approaches or exceeds the line limit, you **MUST** refactor and split it before considering the task complete.
- **For `.tsx`:** Extract sub-components, custom hooks, or complex JSX blocks into separate files within the same directory (e.g., `components/`, `hooks/`).
- **For `.ts`:** Extract types/interfaces into `.types.ts`, constants into `.constants.ts`, or split large utility functions into domain-specific files.
- **Rule of Thumb:** A file should do ONE thing well. If it requires scrolling for more than 2 screens, it needs to be split.

---

## 4. Architecture & Folder Structure
Follow the standard Next.js App Router structure, organized by feature/domain where possible.

### 4.1. Backend Layering (TypeScript + Repository/Service Pattern)
All backend code MUST be TypeScript and follow this strict layering:
- `repositories/` — ONLY raw CQL queries via the ScyllaDB client. No business logic here. One repository per aggregate (e.g., `booking.repository.ts`, `part.repository.ts`).
- `services/` — Business logic, validation, and orchestration. Services call repositories, NEVER the ScyllaDB client directly.
- Route handlers (`app/api/.../route.ts`) — Thin layer: parse/validate input, call a service, format the response. NEVER write CQL or business logic here.
- Shared row/response shapes live in `.types.ts` files next to the repository.

---

## 5. Database Guidelines (ScyllaDB)
ScyllaDB is a high-performance NoSQL wide-column store (Cassandra compatible).
- **Query-Driven Design:** Design tables based on read/write query patterns, NOT relational schemas. 
- **No Joins:** Do not attempt SQL-like joins. Denormalize data if necessary.
- **Partition Keys:** Always choose partition keys carefully to ensure even data distribution across the cluster.
- **Client:** Use a ScyllaDB/Cassandra compatible Node.js driver (e.g., `cassandra-driver` or a modern Bun-compatible alternative).
- **Migrations:** Keep schema creation scripts in `lib/db/migrations/`.

---

## 6. UI/UX & Styling Rules (Tailwind CSS)
- **Pure Tailwind:** Use ONLY Tailwind utility classes. 
- **NO Custom CSS:** Do not create `.css` files for component styling. The only CSS file allowed is `globals.css`, which MUST contain EXACTLY these 2 lines and nothing else:
  ```css
  @import "tailwindcss";
  @custom-variant dark (&:where(.dark, .dark *));
  ```
  No `@theme` tokens, no `@keyframes`, no custom classes, no CSS variables.
- **No Inline Styles:** Avoid `style={{}}` attributes. Use Tailwind classes.
- **Responsive Design:** Mobile-first approach. Always use Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) to ensure the app looks perfect on mobile phones, tablets, and desktops.
- **Vietnamese UI Language:** All user-facing text MUST be in Vietnamese WITH full diacritics (tiếng Việt có dấu, e.g., "Đặt lịch sửa xe", NOT "Dat lich sua xe"). Never output unaccented/Telex-style Vietnamese in the UI.
- **Minimal Box-Shadow:** Do NOT use `box-shadow` (`shadow-*` utilities) to create emphasis or hierarchy. Use borders (`border`, `divide-*`), spacing, typography scale/weight, and color contrast instead. A subtle shadow is allowed ONLY for floating overlays (modal, dropdown, tooltip).
- **Dark/Light Theme (class strategy):** The app supports ONLY two themes: light and dark.
  - Tailwind v4 MUST use class-based dark mode via `@custom-variant dark (&:where(.dark, .dark *));` in `globals.css` (do NOT rely on the default `prefers-color-scheme` variant alone).
  - On first visit with no saved preference, detect the OS theme via `window.matchMedia("(prefers-color-scheme: dark)")` and apply it. NEVER hardcode a default theme.
  - Persist the user's explicit choice in `localStorage` and apply the `dark` class on `<html>` before paint (inline init script) to avoid a flash of the wrong theme. Listen to OS theme changes while no explicit choice is saved.
  - A visible theme toggle button MUST sit next to the login button in the header, with Vietnamese accessible labels (e.g., `aria-label="Chuyển sang giao diện tối"` / `"Chuyển sang giao diện sáng"`).
- **Monochrome Palette:** UI uses ONLY neutral colors (white, zinc scale, black) for light/dark themes. Do NOT introduce other hues (no orange/blue/green/red accents) except semantic states explicitly requested. Hierarchy comes from borders, spacing, typography, and `dark:` contrast — not from color.
- **Subtle Animations (Tailwind only):** Keep the UI lively with SMALL, fast micro-animations built ONLY from Tailwind utilities.
  - Prefer built-in `transition-*`, `duration-*`, `ease-*` (hover/active states) and `animate-*` for enter effects.
  - Custom keyframes are FORBIDDEN in ALL forms — no `@keyframes`, no `@theme --animate-*` tokens. `globals.css` MUST stay exactly 2 lines (`@import` + `@custom-variant dark`). Any animation needing keyframes is OUT of scope; use instant render instead.
  - Allowed animation tools: `transition-*`, `duration-*` (max ~300ms), `ease-*`, state variants (`hover:`, `active:`, `focus-visible:`, `group-hover:`) with transform utilities (`scale-*`, `rotate-*`, `translate-*`), and built-in `animate-*` utilities (`animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce` — loading indicators only).
  - ALWAYS scope animations behind the `motion-safe:` variant so users with `prefers-reduced-motion` get a static UI.
- **Naming & Language:** All user-facing text MUST be in Vietnamese WITH full diacritics (tiếng Việt có dấu, e.g., "Đặt lịch sửa xe", NOT "Dat lich sua xe"). All code identifiers (variables, functions, types, components, hooks) and URL paths MUST be in English (e.g., `ThemeToggle`, `/dang-nhap` is FORBIDDEN — use `/login`).

---

## 7. Data Fetching & State Management (TanStack Query)
- **Separation of Concerns:** 
  - `services/` folder: Contains the actual `fetch`/`axios` API calls.
  - `hooks/` folder: Contains TanStack Query wrappers (`useQuery`, `useMutation`).
  - `components/`: ONLY consumes the hooks. Never write raw `fetch` calls inside `.tsx` components.
- **Query Keys:** Always use structured query keys (e.g., `['bookings', { status: 'pending' }]`).
- **Optimistic Updates:** Use TanStack Query's `onMutate` and `onError` for optimistic UI updates when creating/updating bookings.
- **Caching:** Configure appropriate `staleTime` and `gcTime` for different data types (e.g., vehicle models can be cached longer than booking statuses).

---

## 8. AI Agent Instructions
When generating code for this project, you MUST:
1. **Count your lines:** Before outputting a file, estimate the line count. If `.tsx` > 250 or `.ts` > 350, immediately refactor and split the code into multiple files.
2. **Use Bun:** Always suggest `bun` commands for installation and execution.
3. **Strict Tailwind:** Never output custom CSS or CSS modules. If a design requires complex styling, break it down into Tailwind utilities or suggest a Headless UI component.
4. **TypeScript Strict:** Ensure all props, API responses, and database rows are strictly typed. Avoid `any`.
5. **ScyllaDB Awareness:** When writing database queries, ensure they are valid CQL and respect NoSQL modeling principles (no `JOIN`, careful use of `ALLOW FILTERING`).
6. **Component Composition:** Prefer composing smaller components over writing massive monolithic components. Extract logic into custom hooks to keep `.tsx` files clean and under the 250-line limit.
7. **Git Safety:** After finishing a coding task, follow the Git Workflow Rules defined in **Section 9** to check for garbage files. **NEVER** execute any git write operations (commit, branch, tag, push) on your own.

---

## 9. Git Workflow Rules (CRITICAL)
Git operations are **HIGHLY RESTRICTED**. The AI agent must follow these rules with zero exceptions.

### 9.1. ALLOWED Git Operations (Read-Only)
Git is used ONLY to inspect the working tree — i.e., to see which files changed and which garbage/unintended files must be left out of a commit. The AI agent is ONLY allowed to run the following **read-only** git commands:
- `git status` — To check the current state of the working directory.
- `git diff` — To review changes before reporting them to the user.
- `git log` — To understand commit history (read-only).
- `git branch` (without arguments) — To list existing branches (read-only).
- `git stash list` — To inspect stashes (read-only).

### 9.2. FORBIDDEN Git Operations (Write - STRICTLY PROHIBITED)
The AI agent is **STRICTLY FORBIDDEN** from executing any of the following commands **without explicit user confirmation in the current conversation**:
- ❌ `git add` (any form, including `git add .`, `git add -A`, `git add <file>`)
- ❌ `git commit` (any form)
- ❌ `git push`
- ❌ `git branch <new-branch>` (creating new branches)
- ❌ `git checkout -b` / `git switch -c` (creating and switching to new branches)
- ❌ `git tag` (creating tags)
- ❌ `git merge` / `git rebase`
- ❌ `git reset --hard`
- ❌ `git clean -fd`
- ❌ Any other git command that modifies the repository state.

**Reason:** Commit messages, branch names, tags, and what gets committed are **human decisions**. The AI must never make these decisions autonomously.

### 9.3. Post-Task Git Status Check (MANDATORY)
After completing ANY coding task (creating, modifying, or deleting files), the AI agent **MUST**:
1. Run `git status` to inspect the working directory.
2. Identify any **garbage / unintended files** that should NOT be committed.
3. Report them clearly to the user with a warning.
4. Suggest adding them to `.gitignore` if they are recurring artifacts.

### 9.4. Garbage Files to Watch For
The following files/folders are considered **GARBAGE** and must NEVER be committed. If detected, warn the user immediately:
- `node_modules/`
- `.env`, `.env.local`, `.env.*`, `.env.example` (if containing secrets)
- `.next/`, `dist/`, `build/`, `.turbo/`
- `bun.lockb` (optional — user decides)
- `coverage/`, `.nyc_output/`
- `*.log`, `npm-debug.log*`, `bun-debug.log*`
- `.DS_Store`, `Thumbs.db`, `desktop.ini`
- `*.tsbuildinfo`
- Temporary files: `*.tmp`, `*.bak`, `*.swp`, `*~`
- IDE-specific: `.vscode/` (unless shared settings), `.idea/`
- Any file containing **secrets, API keys, tokens, or passwords** (e.g., `serviceAccountKey.json`, `credentials.json`)

### 9.5. Reporting Format
When reporting git status after a task, use this format:
