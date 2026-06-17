<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:styling-agent-rules -->
# Strict Design System Enforcement

You MUST strictly follow `DESIGN-cursor.md` for all styling and architectural design decisions.
- Do NOT use plain Tailwind colors (e.g., `bg-white`, `text-black`, `bg-zinc-900`) unless explicitly permitted by the design token mapping.
- The application uses a strictly defined set of CSS variables configured in `globals.css` (e.g., `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`).
- For standard CTA buttons, use `bg-primary text-primary-foreground hover:opacity-90`.
- The theme dynamically switches between a light "editorial cream" mode and a dark "IDE pitch black" mode. Ensure all components use semantic variables that respect both modes cleanly.
- If you need to verify what CSS variables are available, ALWAYS refer to `DESIGN-cursor.md` and `globals.css` first.
<!-- END:styling-agent-rules -->
