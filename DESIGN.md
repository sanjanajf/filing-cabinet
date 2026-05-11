# Design: Personal Writing Moodboard (working title)

**For:** Sanjana
**Generated:** 2026-05-11 (via `/office-hours` brainstorm)
**Status:** APPROVED (design only — implementation deferred)
**Mode:** Builder (personal software)

---

## Problem Statement

Notes and writing fragments are scattered across Apple Notes (hundreds), Stickies, Google Docs, and informal todo lists. There's no single place that holds the whole picture: ideas in progress, article drafts, emerging book threads, running observations about urbanism / SF / culture, and the residue of daily life.

Existing tools have been tried and rejected: Notion (UI is hated), generic todo apps (wrong shape — tasks are not the actual problem). The right tool is moodboard-shaped — visual, spatial, clickable — with AI that can chat with the contents and reflect themes back.

This is personal software in the truest sense: built by Sanjana, for Sanjana, evolving with use.

## What Makes This Cool

- Files stay on the Mac. Maximum privacy, maximum durability, zero platform risk.
- The UI is shaped like Sanjana actually thinks about writing — wandering, spatial, exploratory — not like a page or a list.
- AI is a layer (chat with notes, surface themes), not the writer. The craft stays hers.
- Building it dogfoods the YC-2026 thesis (one person + Claude Code builds what used to be a team project). Worth a Root Access post when shipped.

## Constraints

- **Local-first.** Never deployed to the public internet.
- **Markdown files on disk** as source of truth (portable, future-proof, AI-readable).
- **Built by Sanjana with Claude Code as pair.** Novice-coder-friendly stack required (Next.js, not Rust/Tauri).
- **Google Docs stays** as the drafting surface for finished articles. This tool is for ideas, notes, book threads, and reflection — not long-form drafting.
- **Anthropic API costs** should stay modest (<$20/month even with regular chat use). Prompt caching required.

## Premises (agreed)

1. Google Docs remains the drafting surface for articles.
2. Files-on-disk markdown is required so the AI layer can read everything.
3. Visual / spatial / clickable is the UX north star.
4. Container types: articles in progress, book threads, running ideas, raw capture.
5. Importing existing chaos (Apple Notes, Stickies, old Docs) is a real one-time project — separate from v1.
6. AI's role is **chat + theme reflection**, not drafting or auto-organization.

## Approaches Considered

### Approach A: Heptabase (existing paid app)
- $8/mo. Beautiful visual whiteboard. Some AI built in.
- **Rejected** because Sanjana wants custom UI, custom features, and to own this forever.

### Approach B: Obsidian + Canvas plugin + Claude Code over the vault
- Free. Markdown files in a vault, visual canvas plugin, AI via Claude Code in terminal.
- **Rejected** because the canvas plugin isn't moodboard-shaped enough, and customizing Obsidian is harder than building from scratch with Claude Code.

### Approach C: Build it — Next.js, local-first, files on disk (CHOSEN)
- Custom Next.js web app running on `localhost`. Markdown files in `~/writing/`. Draggable card canvas. Claude API chat sidebar. Built by Sanjana with Claude Code over ~2 weekends.

## Recommended Approach: Build It

### Architecture

- **Storage:** `~/writing/` on the Mac.
  - One markdown file per card (e.g. `housing-density-thought.md`, `book-ch3-loneliness.md`).
  - `layout.json` next to it stores card positions, board memberships, tags.
  - `assets/` folder for images.
- **App:** Next.js (App Router). One codebase, frontend + backend.
- **Frontend:** React canvas with draggable cards. **Custom-built** (~200 lines of React + CSS transforms) — drag-and-drop libraries are overkill for v1. Tailwind for styling.
- **Backend:** Next.js API routes that read/write files in `~/writing/` and call the Claude API.
- **AI:** Anthropic API directly. API key in local `.env`. Prompt caching enabled to keep costs low. Default model: Claude Sonnet 4.6. Switch to Opus 4.7 for heavier synthesis ("find themes across all my notes").
- **Run:** `npm run dev` on `localhost:3000`. Bookmark it. Never deploy.
- **Privacy:** Note content only leaves the Mac when chat sends it to Claude (TLS, Anthropic standard data terms — no training on inputs). Everything else is local-only.
- **Phone sync (later, not v1):** Put `~/writing/` inside iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/writing/`). Create new markdown files on iPhone via Files app or [Drafts](https://getdrafts.com). They sync down; the app picks them up.

### v1 Scope — One Weekend, Ugly is Fine

1. Drop a `.md` file into `~/writing/` → appears as a card on the canvas (title + first line preview).
2. Drag cards around. Positions persist to `layout.json`.
3. Click a card → side panel opens with markdown editor. Saves on blur.
4. Chat sidebar → asks Claude anything. The backend sends all note content (or a relevant subset) + the question.
5. Ship. Use it for a week before adding anything.

### v2 Additions — Only After Using v1 for a Week

- Multiple boards/canvases (one per project: book, zine V2, running ideas).
- Tags + filter view ("show only #book-ch3").
- "Find action items across my notes" → generated todo list (a specific chat prompt + a saved view).
- Keyboard shortcuts (cmd+N new card, cmd+K focus chat, cmd+/ search).
- Card colors / visual grouping.

### v3 / Deferred but Planned

- Importers: Apple Notes (export to .txt + parser), Stickies (read from `~/Library/Containers/com.apple.Stickies/`), Google Docs (Takeout zip).
- Theme-detection weekly summary ("you've been circling X").
- iPhone capture polish (Drafts integration, share extension).
- Embeddings index for fast retrieval when the corpus gets large (>500 notes).

## Open Questions

- **API key management:** Anthropic API key in `.env` is fine for v1. Worth flagging the cost model before launch — set a $20 spend cap in the Anthropic console.
- **Naming:** What's this thing actually called? "Moodboard" is generic. State-of-the-Art-coded options to noodle: Workshop, Atelier, Salon, Marginalia, Constellation, Field Notes, Threadboard, Loom. Don't bikeshed this before v1 ships — call it `writing-app` for now.
- **Apple Notes triage:** How many of the hundreds of notes are worth importing vs. abandoning? Worth a 30-min triage before writing an importer. Probably 80% can be left in Apple Notes as cold storage.

## Success Criteria

- **v1:** Opens daily for one week.
- **v2:** One article or book passage gets written *using this as its source notes*.
- **v3:** At least 50 notes imported from existing chaos.
- **Real win:** Finding yourself reaching for *this* instead of Apple Notes when a new idea arrives.

## Distribution Plan

N/A — personal software. Lives only on Sanjana's Mac. If eventually shared (open source / Root Access post / show-and-tell to other writers), distribution is "git clone and run it yourself" — explicitly not a SaaS.

## Next Steps — When Ready to Build

1. `mkdir ~/writing-app && cd ~/writing-app && npx create-next-app@latest .` (TypeScript, App Router, Tailwind: yes).
2. Move this design doc into the project: `mv ~/writing-app-design.md ~/writing-app/DESIGN.md`.
3. `mkdir ~/writing && echo "# my first note" > ~/writing/hello.md`.
4. Open Claude Code in the project: `cd ~/writing-app && claude`.
5. Ask Claude Code to implement v1, one feature at a time, in this order:
   - Read `.md` files from `~/writing/` and return their metadata via an API route.
   - Render them as cards on a page (no canvas yet — just a grid).
   - Add the canvas (custom drag with `mousedown/mousemove/mouseup` handlers + `transform: translate(x, y)`).
   - Add position persistence to `layout.json`.
   - Add the card editor side panel.
   - Add the chat sidebar (use the `@anthropic-ai/sdk` package, prompt caching enabled).
6. Ship v1 ugly. Use it for one week. Then come back for v2.

The Apple Notes / Stickies / Google Docs import is its own project. Don't conflate it with building the tool. Build the tool first, then import.

## What I Noticed About How You Think

- You opened this conversation asking how to organize a chaotic todo list, and within 20 minutes correctly diagnosed that the real problem wasn't tasks but *capture and reflection*. The exact line was: "I mean part of what I'm wondering is if I should not make this a todo list but rather a repository of my writing notes and reflections that has AI built in." That reframing — separating what looks like the problem from what it actually is — is the same move good editors make on a draft.

- You pushed back when I steered conservative. "You don't think I should build this, basically?" Most people accept the recommended option. You read the absence in what I proposed and called it out. Same instinct as cutting a piece for what it's missing rather than what it has.

- You named the actual reason to build vs. buy: "I want my files to stay private. I want the UI to be customized. I want to add in a bunch of features for myself." That's ownership and personalization, not efficiency or cost. It's the right reason and people often dress it up as something more rational.

- You called the category correctly: "I think this is really personalized software." That phrase is doing a lot of work. Most people don't have the vocabulary for software that isn't a product, isn't a tool someone else made, isn't open source — just *yours*. You did.

- The Notion-UI rejection is a strong taste signal. You won't settle for almost-right. Better to build the exactly-right thing slowly than tolerate a wrong-shaped one forever. That's the same standard a zine editor applies to a layout.

---

## When You Come Back

This design doc is the contract. Move it into the project directory (`~/writing-app/DESIGN.md`) when you start building. Claude Code will read it as context. The v1 scope above is intentionally small — resist adding to it before you've used the ugly version. Ship the smallest thing that works. The whole point of this is to use it.
