# Monorepo Restructuring Plan: UI Components Package

## Overview

Restructure spesen-tool from a single Next.js app into a Turborepo monorepo with shared UI components package, following shadcn/ui monorepo best practices.

**Target Structure:**
```
spesen-tool/
├── apps/
│   └── web/                 # Next.js application
├── packages/
│   └── ui/                  # Shared UI components library
├── pnpm-workspace.yaml
└── turbo.json               # Already exists, will update
```

## Phase 1: Create Monorepo Foundation

### 1.1 Create pnpm Workspace Configuration

**Create:** `pnpm-workspace.yaml`
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### 1.2 Create Directory Structure

```bash
mkdir -p apps/web
mkdir -p packages/ui/src/{components,hooks,lib,styles}
```

### 1.3 Update Root package.json

Keep minimal root package.json with only Turborepo scripts. Move all app dependencies to apps/web.

## Phase 2: Set Up packages/ui Package

### 2.1 Create packages/ui/package.json

**Key Points:**
- Name: `@zemio/ui`
- Export UI components, hooks, lib, and globals.css
- Include dependencies: @base-ui/react, clsx, tailwind-merge, lucide-react, etc.
- Use peerDependencies for React

### 2.2 Create packages/ui/tsconfig.json

Configure with:
- ES2022 target
- Strict mode enabled
- Path aliases for `@zemio/ui/*`
- JSX support for React

### 2.3 Create packages/ui/components.json

**shadcn/ui configuration:**
```json
{
  "style": "base-nova",
  "aliases": {
    "components": "@zemio/ui/components",
    "utils": "@zemio/ui/lib/utils",
    "ui": "@zemio/ui/components",
    "lib": "@zemio/ui/lib",
    "hooks": "@zemio/ui/hooks"
  },
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css"
  }
}
```

### 2.4 Move Shared Assets

**Move to packages/ui:**
- `src/styles/globals.css` → `packages/ui/src/styles/globals.css`
- All 34 components from `src/components/ui/*` → `packages/ui/src/components/`
- `src/hooks/use-mobile.ts` → `packages/ui/src/hooks/use-mobile.ts`

### 2.5 Create packages/ui/src/lib/utils.ts

**ONLY include pure utilities (NO Prisma dependencies):**
- `cn()` - Class name merger
- `formatBytes()` - File size formatter
- `formatIban()` / `unformatIban()` - IBAN formatting
- `generateUniqueHash()` - File hash generator
- `renameFileWithHash()` - File renaming

**DO NOT include (Prisma-dependent):**
- `translateReportStatus()` - Uses ReportStatus enum
- `translateExpenseType()` - Uses ExpenseType enum
- `formatTimeElapsed()` - Keep in web for now

### 2.6 Update Component Imports

In all moved UI components, update:
- `@/lib/utils` → `@zemio/ui/lib/utils`
- `@/hooks/use-mobile` → `@zemio/ui/hooks/use-mobile`

## Phase 3: Set Up apps/web Package

### 3.1 Move App Files

**Move to apps/web/:**
```
src/                    → apps/web/src/
public/                 → apps/web/public/
prisma/                 → apps/web/prisma/
next.config.js          → apps/web/next.config.js
.env files              → apps/web/
sentry configs          → apps/web/
```

**Delete from apps/web/src/:**
- `src/components/ui/` (moved to packages/ui)
- `src/hooks/use-mobile.ts` (moved to packages/ui)
- `src/styles/` (moved to packages/ui)

### 3.2 Create apps/web/package.json

**Key changes:**
- Name: `@zemio/web`
- Add dependency: `"@zemio/ui": "workspace:*"`
- Keep all existing app dependencies
- Keep all existing scripts

### 3.3 Create apps/web/components.json

**shadcn/ui configuration:**
```json
{
  "style": "base-nova",
  "aliases": {
    "components": "@/components",
    "utils": "@zemio/ui/lib/utils",
    "ui": "@zemio/ui/components",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Critical:** `utils` points to `@zemio/ui/lib/utils` for shared utils.

### 3.4 Create apps/web/tsconfig.json

Add workspace package paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@zemio/ui/components/*": ["../../packages/ui/src/components/*"],
      "@zemio/ui/hooks/*": ["../../packages/ui/src/hooks/*"],
      "@zemio/ui/lib/*": ["../../packages/ui/src/lib/*"]
    }
  }
}
```

### 3.5 Create apps/web/src/app/globals.css

**Import shared theme:**
```css
@import "@zemio/ui/globals.css";
```

### 3.6 Update apps/web/src/lib/utils.ts

**Hybrid approach - re-export shared + add app-specific:**
```typescript
// Re-export shared utils from @zemio/ui
export { cn, formatBytes, formatIban, unformatIban, renameFileWithHash } from "@zemio/ui/lib/utils";

// App-specific utils (Prisma-dependent)
export function translateReportStatus(status: ReportStatus) { ... }
export function translateExpenseType(type: ExpenseType) { ... }
export function formatTimeElapsed(date: Date): string { ... }
```

This maintains backward compatibility - all imports from `@/lib/utils` still work.

## Phase 4: Update Import Paths in apps/web

### 4.1 Update UI Component Imports

**Find and replace across apps/web/src/:**

Pattern: `from "@/components/ui/([^"]+)"`
Replace: `from "@zemio/ui/components/$1"`

**Examples:**
- `from "@/components/ui/button"` → `from "@zemio/ui/components/button"`
- `from "@/components/ui/dialog"` → `from "@zemio/ui/components/dialog"`

**Affected files:** ~47 files based on exploration (all components, forms, pages)

### 4.2 Update Layout Imports

**apps/web/src/app/layout.tsx:**
- Change: `import "@/styles/globals.css"` → `import "./globals.css"`
- Change: `import { Toaster } from "@/components/ui/sonner"` → `import { Toaster } from "@zemio/ui/components/sonner"`

### 4.3 Files That DON'T Need Changes

Imports from `@/lib/utils` work unchanged because apps/web/src/lib/utils.ts re-exports from @zemio/ui.

## Phase 5: Update Turborepo Configuration

### 5.1 Update turbo.json

Add `dependsOn: ["^dev"]` to dev task to ensure packages/ui is ready:

```json
{
  "tasks": {
    "dev": {
      "dependsOn": ["^dev"],
      "cache": false,
      "persistent": true
    }
  }
}
```

Keep all other tasks as-is.

## Phase 6: Installation & Verification

### 6.1 Clean and Install

```bash
# From repository root
rm -rf node_modules .next pnpm-lock.yaml

# Install dependencies
pnpm install

# Generate Prisma client
cd apps/web && pnpm run db:generate && cd ../..
```

### 6.2 Verify TypeScript

```bash
# From root
turbo run typecheck
```

Should pass with no errors.

### 6.3 Test Development Mode

```bash
# From root
pnpm dev
```

Verify:
- Next.js starts correctly
- Hot reload works for UI components
- Tailwind CSS compiles with shared theme
- All pages render correctly

### 6.4 Test Build

```bash
# From root
pnpm build
```

Should build apps/web successfully.

### 6.5 Test shadcn/ui CLI

```bash
# From apps/web
cd apps/web
npx shadcn@latest add accordion
```

CLI should detect monorepo and work correctly.

## Critical Files Reference

**Configuration Files:**
1. `pnpm-workspace.yaml` - Workspace definition
2. `packages/ui/package.json` - UI package config
3. `apps/web/package.json` - Web app with workspace dependency
4. `packages/ui/tsconfig.json` - UI TypeScript config
5. `apps/web/tsconfig.json` - Web TypeScript config with paths
6. `packages/ui/components.json` - shadcn config for UI
7. `apps/web/components.json` - shadcn config for web
8. `turbo.json` - Updated Turborepo config

**Code Files:**
9. `packages/ui/src/lib/utils.ts` - Pure utilities
10. `apps/web/src/lib/utils.ts` - Hybrid utils (re-export + app-specific)
11. `packages/ui/src/styles/globals.css` - Shared Tailwind theme
12. `apps/web/src/app/globals.css` - Imports from @zemio/ui
13. `apps/web/src/app/layout.tsx` - Updated imports

**Example Components:**
14. `packages/ui/src/components/button.tsx` - Migrated component
15. `packages/ui/src/hooks/use-mobile.ts` - Migrated hook

## Key Decisions

### What Goes Where

**packages/ui (Shared):**
- ✅ All 34 shadcn/ui components
- ✅ Pure utilities (cn, formatBytes, formatIban)
- ✅ UI hooks (use-mobile)
- ✅ Tailwind theme (globals.css)
- ❌ NO Prisma dependencies
- ❌ NO business logic

**apps/web (Application):**
- ✅ App-specific components (forms, emails, sidebars)
- ✅ Business logic utilities (translateReportStatus, icons.ts)
- ✅ Prisma schema and types
- ✅ tRPC routers
- ✅ Authentication logic
- ✅ Database migrations

### Import Strategy

**From apps/web code:**
- UI components: `@zemio/ui/components/*`
- Shared utils: Can use either `@zemio/ui/lib/utils` OR `@/lib/utils` (re-exported)
- App code: `@/*` (unchanged)

### Backward Compatibility

The hybrid utils approach ensures all existing imports still work:
- `import { cn } from "@/lib/utils"` ✅ Works (re-exported)
- `import { translateReportStatus } from "@/lib/utils"` ✅ Works (defined in web)

## Potential Issues & Solutions

### Issue 1: TypeScript Path Resolution

**Solution:** Configure paths in both tsconfig files with relative paths to packages.

### Issue 2: Hot Module Replacement

**Solution:** Next.js Turbopack (--turbo flag) handles monorepos well. If issues, add `transpilePackages: ["@zemio/ui"]` to next.config.js.

### Issue 3: Duplicate React Dependencies

**Solution:** Use peerDependencies in packages/ui. pnpm hoists automatically.

### Issue 4: Prisma Client Location

**Solution:** Keep Prisma in apps/web only. Generate client with postinstall script.

## Testing Checklist

- [ ] All pages load correctly
- [ ] Authentication flows work
- [ ] Forms submit successfully
- [ ] File uploads work
- [ ] Database operations work
- [ ] Hot reload works for both packages
- [ ] Builds complete successfully
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Light/dark mode toggle works
- [ ] shadcn/ui CLI works

## Rollback Plan

If migration fails:
```bash
git stash  # or git reset --hard
git checkout chore/migrate-to-turbo-repo
pnpm install
pnpm dev
```

Database is unaffected - no data loss risk.

## Next Steps (Future)

After UI package is working:
1. Create `packages/auth` for better-auth logic
2. Create `packages/database` for Prisma schema
3. Create `packages/email` for email templates
4. Consider extracting tRPC shared types

---

**Estimated Implementation Time:** 2-4 hours
**Risk Level:** Medium (many file moves, but no data changes)
**Rollback Time:** < 5 minutes
