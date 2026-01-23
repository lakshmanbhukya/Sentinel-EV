# 🛠️ Applied AI Framework Rules & Coding Standards

**Objective:** Ensure all generated code is production-ready, highly performant, and follows modern React + Vite best practices.

## 1. Core Tech Stack (The "Modern Stack")

* **Framework:** React 18+ with **Vite** for build tooling and development server.
* **Routing:** **React Router DOM** for client-side routing and navigation.
* **Styling:** **Tailwind CSS** (Utility-first approach).
* **Components:** **Shadcn/UI** (Radix UI + Tailwind) for core primitives.
* **Icons:** **Lucide React**.
* **Types:** **TypeScript** (Strict mode). No `any` types allowed.
* **State Management:** Use `React Context` or `Zustand` for global state; `TanStack Query` for server-state/data-fetching.

## 2. Component Architecture

* **Atomic Design:** Keep components small and focused.
* `src/components/ui`: Shadcn primitives (Input, Button, Card).
* `src/components/shared`: Reusable custom components (Sidebar, Navbar).
* `src/components/dashboard`: Page-specific features (RevenueChart, LeadTable).


* **Client-Side Rendering:** All components render on the client. Use `useEffect` and `useState` for data fetching and state management.
* **Prop Types:** Every component must have an interface/type definition for its props.

## 3. Tailwind & Styling Standards

* **No Arbitrary Values:** Avoid `w-[342px]`. Use standard Tailwind scales (`w-64`, `w-full`).
* **Conditional Classes:** Use the `cn()` utility (clsx + tailwind-merge) for dynamic classes.
* *Example:* `className={cn("text-sm", isActive && "text-blue-600")}`


* **Responsive Design:** Always code **Mobile-First**. Use `sm:`, `md:`, `lg:`, and `xl:` prefixes to handle larger screens.
* **Dark Mode:** Use the `dark:` variant for all components. Refer to CSS variables (e.g., `bg-background`, `text-foreground`) instead of hardcoding hexes where possible.

## 4. AI-Specific Coding Instructions

* **No Placeholders:** Never write `// Logic goes here`. Write the actual logic or at least a functional mock.
* **Real Data Mapping:** Map components to the fields defined in `data-model.md`. Do not invent generic variable names like `item1`, `item2`.
* **Self-Documenting Code:** Use descriptive variable and function names. Add brief JSDoc comments for complex logic.
* **Error Handling:** Include basic error boundaries and "Loading" states for all data-dependent components.

## 5. Directory Structure Standards

All new projects must follow this directory map:

```
├── src/
│   ├── components/           # UI, Shared, and Feature components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions (utils.ts, constants.ts)
│   ├── pages/                # Route components
│   ├── types/                # Global TypeScript definitions
│   ├── App.tsx               # Main app component with routing
│   └── main.tsx              # Vite entry point
├── public/                   # Static assets (images, fonts)
└── index.html                # HTML template

```
---

## 🔄 Migration Notes

### Key Conceptual Changes
- **Framework:** Replaced Next.js App Router with React + Vite + React Router DOM
- **File Structure:** Moved from `app/` directory to `src/` directory structure
- **Rendering:** Shifted from server components to client-side rendering with hooks
- **Data Fetching:** Replaced `getServerSideProps` with `useEffect` and `TanStack Query`

### Tradeoffs vs Next.js
- **Lost:** Server-side rendering, automatic code splitting, built-in API routes, file-based routing
- **Gained:** Faster development with Vite HMR, explicit routing control, simpler deployment, better debugging
- **Changed:** Manual routing setup required, explicit data fetching patterns, separate backend architecture

### When Next.js Would Still Be Better
- SEO-critical applications requiring server-side rendering
- Projects needing built-in API functionality
- Teams preferring convention-over-configuration approach
- Applications requiring advanced performance optimizations like ISR