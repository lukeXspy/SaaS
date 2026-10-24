<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Design System — BRAND.md

**Before making any visual/UI change** (colors, spacing, typography, animations, component styling, layout), read and follow `BRAND.md` at the project root. It contains:

- Design tokens (colors, typography, spacing, radius)
- Rules for motion (what's allowed vs prohibited per surface)
- Component patterns (stat cards, lists, badges, navigation)
- Mode assignments (Persuade for landing/auth, Operate for app/campo)

If a proposed change conflicts with BRAND.md tokens or rules, discuss with the user before implementing. Do not silently override the design system.
