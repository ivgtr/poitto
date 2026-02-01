# Agent Guidelines for Poitto

## Build / Lint / Test Commands

```bash
# Development
npm run dev              # Start Next.js dev server

# Build & Production
npm run build            # Build production bundle
npm start                # Start production server

# Linting
npm run lint             # Run ESLint (Next.js config)

# Testing
npm test                 # Run all tests (Vitest)
npm test -- --run       # Run tests once (CI mode)
npm test -- src/lib/task-fields.test.ts --run  # Run single test file
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Run with coverage report
```

## Code Style Guidelines

### TypeScript
- Use **strict TypeScript** mode - all types must be explicit
- Use `interface` for object types, `type` for unions/aliases
- Export types from `src/types/` or alongside implementations
- Use path alias `@/` for all imports (maps to `./src/*`)
- **NEVER use `as` type assertions** - use proper type guards or Zod validation instead
- Use function overloads for type-safe mapping functions (see `src/domain/task/mapping.ts`)

### Naming Conventions
- **Components**: PascalCase (`TaskBubble`, `HomeClient`)
- **Functions/Variables**: camelCase (`parseTimeFromInput`, `taskInfo`)
- **Constants**: UPPER_SNAKE_CASE (`REQUIRED_FIELDS`, `INVALID_TITLES`)
- **Types/Interfaces**: PascalCase (`TaskInfo`, `ParseResult`)
- **Files**: kebab-case for components (`home-client.tsx`), camelCase for utils

### Imports Order
1. External libraries (React, Next.js, etc.)
2. Third-party packages (framer-motion, etc.)
3. Internal components (`@/components/*`)
4. Internal hooks (`@/hooks/*`)
5. Internal services (`@/services/*`)
6. Internal utilities (`@/lib/*`)
7. Types (`@/types/*`)

### React Components
- Mark client components with `"use client"` at top
- Use functional components with explicit return types when complex
- Destructure props in function parameters
- Use `useState`, `useEffect`, `useRef` from React

### Server Actions & API
- Mark server actions with `"use server"`
- Return consistent error shapes: `{ error: string }`
- Use Prisma for database operations
- Handle errors with try/catch and toast notifications

### Error Handling
- Use `sonner` for toast notifications
- Always wrap async operations in try/catch
- Log errors to console with context: `console.error("[Context] Error:", error)`
- Return user-friendly error messages in Japanese for UI

### Testing (Vitest)
- Place tests alongside source files: `src/lib/task-fields.test.ts`
- Use `describe` for grouping, `it` for test cases
- Test file naming: `*.test.ts` or `*.spec.ts`
- Use explicit assertions: `expect(value).toBe(expected)`
- Test edge cases and bug regressions

#### Mock Setup Best Practices
- Use module-level mock functions that can be configured per test
- Example pattern for OpenAI mocking:
  ```typescript
  const mockCreate = vi.fn()
  vi.mock('openai', () => ({
    default: vi.fn(() => ({
      chat: { completions: { create: (...args) => mockCreate(...args) } }
    }))
  }))
  ```

#### Test Organization
- Group tests by functionality using `describe`
- Use `beforeEach` to reset mocks
- Mock external APIs, not internal logic

#### Edge Cases to Test
- API failures and error handling
- Invalid input formats
- Null/undefined handling
- Date boundary cases (timezone, DST)

### File Structure
```
src/
├── app/           # Next.js App Router (pages, API routes, layouts)
├── components/    # React components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and pure functions (testable)
├── services/      # Business logic and external API calls
├── types/         # TypeScript type definitions
└── test/          # Test utilities and setup
```

### Database (Prisma)
- Schema in `prisma/schema.prisma`
- Generate migrations: `npx prisma migrate dev`
- Client singleton in `src/lib/prisma.ts`
- Use type-safe queries with Prisma Client

### LLM Integration
- Use OpenAI SDK for both OpenAI and OpenRouter
- Support multiple providers via config
- Prompts should handle Japanese text properly (UTF-8)

### Date/Time Handling
- **deadline**: Always use 23:59 time internally (ISO8601 format)
  - Display without time (e.g., "明日まで")
  - Internal format: `"2026-02-02T23:59:00+09:00"`
- **scheduledDate**: YMD format only (e.g., `"2026-02-02"`)
- **scheduledTime**: HH:mm format or time slot names
  - Time slots: "morning" (07:00), "noon" (12:00), "afternoon" (15:00), "evening" (18:00)
  - If null, task goes to inbox (not timeline)
- Use `DEFAULT_TIME_SLOTS` constant for time slot defaults (user-configurable in future)
- Helper functions in `src/domain/task/time-utils.ts`:
  - `createDeadlineDateTime()` - Creates deadline with 23:59
  - `combineDateAndTime()` - Combines scheduledDate + scheduledTime
  - `parseRelativeDate()` - Parses "明日", "今日", etc.

### Key Libraries
- **Framework**: Next.js 16 (App Router)
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Animation**: Framer Motion
- **Auth**: NextAuth.js v4
- **Database**: Prisma + PostgreSQL
- **Testing**: Vitest + React Testing Library
- **Icons**: Lucide React
- **Validation**: Zod for runtime type checking

## Type Safety & Runtime Validation

### Zod for Runtime Validation
- **Always prefer Zod schemas** over type assertions (`as`)
- Define schemas in `src/domain/task/schemas.ts` for complex types
- Use `safeParse()` for validation that doesn't throw
- Example:
  ```typescript
  const result = TaskInfoSchema.safeParse(data);
  return result.success ? result.data : null;
  ```

### Function Overloads for Type Safety
- Use function overloads when return type depends on input parameter
- Example in `src/domain/task/mapping.ts`:
  ```typescript
  export function mapOptionToFieldValue<K extends keyof FieldValueMap>(
    option: string,
    fieldName: K
  ): FieldValueMap[K];
  ```

### Type Guards
- Use type guards (e.g., `isMappableField()`) instead of type assertions
- Type guards provide runtime safety and compile-time type narrowing
- Place type guards close to the type definitions

## Language Notes
- Code and comments: English
- User-facing text: Japanese
- Error messages for users: Japanese
- Log messages for developers: English

## Architecture Principles

### DRY (Don't Repeat Yourself)
- **Always check existing implementations** before writing new code
- Search for similar functionality in `src/lib/`, `src/services/`, and `src/components/`
- If you find duplicated logic, refactor it into a shared utility
- Example: If parsing time in multiple places, extract to `src/lib/time-parser.ts`

### SOLID Principles
- **Single Responsibility Principle**: Each file should do one thing well
- Keep files under 200 lines when possible
- Split large components into smaller, focused components
- Extract business logic from components into `src/lib/` or `src/services/`
- Separate data access (Prisma) from business logic

### File Size Guidelines
- Components: Max 150 lines (split if larger)
- Utilities: Max 100 lines (extract if larger)
- Services: Max 200 lines (refactor if larger)

## Documentation

### All Plans and Documentation
- Store all documentation in `docs/` directory
- Create plan documents before major refactors: `docs/PLAN-feature-name.md`
- Document architectural decisions: `docs/ADR-NNN-decision-name.md`
- Keep refactoring plans updated: `docs/REFACTORING.md`

### Key Documents Created During Development
- `docs/IMPROVEMENT_PROPOSAL.md` - Phase 2/3 improvement proposals with smart questioning and progressive disclosure
- `docs/PROMPT_DESIGN.md` - LLM prompt design specifications for context understanding
- `docs/TEST_ASSESSMENT_REPORT.md` - Comprehensive test coverage analysis
- `src/domain/task/schemas.ts` - Zod validation schemas for runtime type safety
- `src/domain/task/mapping.ts` - Type-safe field mapping with function overloads
- `src/lib/time-utils.ts` - Date/time handling utilities with JST support

## Critical Patterns
- Always use `@/` path alias (never relative paths like `../`)
- Mark Server Actions with "use server" explicitly
- Use `toast.error()` for user-facing errors
- Keep domain logic in `src/lib/` - pure functions are testable
- Use `TaskInfo` interface for task data structure consistently
- **Never use `as` type assertions** - prefer Zod or proper type guards
- Handle date/time carefully: deadline (with 23:59), scheduledDate/scheduledTime (separated)

## Common Tasks

### Adding a New Test
```bash
# Create test file alongside source
src/lib/my-function.test.ts

# Run single test
npm test -- src/lib/my-function.test.ts --run
```

### Database Changes
```bash
# Update schema
npx prisma migrate dev --name describe_change
npx prisma generate

# Reset database (dev only)
npx prisma migrate reset
```

### Type Safety Checks
```bash
# Run TypeScript compiler
npx tsc --noEmit

# Run linter
npm run lint
```

## Implementation Learnings

### Phase 1-3: SRP/DRY Refactoring
Successfully split 3 large files violating single responsibility:
- `task-edit-dialog.tsx` (253 lines → 4 files)
- `chat-interface.tsx` (230 lines → 5 files)  
- `use-task-creation.ts` (237 lines → 2 files)

### Phase 2: Context Understanding Enhancement
- Added durationMinutes extraction
- Implemented smart questioning (skip already-filled fields)
- Added progressive disclosure (show primary options first, with "show more")
- Implemented continuation handling with LLM for ambiguous inputs

### Type Safety Improvements
- **Eliminated all `as` type assertions** using Zod and function overloads
- Created type-safe mapping functions with discriminated unions
- Implemented proper type guards (isMappableField, etc.)
- Added runtime validation with Zod schemas

### Date/Time Architecture
- Separated deadline (always 23:59) from scheduledDate/scheduledTime
- Time slots with default values (user-configurable in future)
- Null time = inbox display (not on timeline)
- Comprehensive time utility functions in time-utils.ts
