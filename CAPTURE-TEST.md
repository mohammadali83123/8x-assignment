# Capture Test

## Setup
- **Tool:** Claude Code (CLI)
- **Models:** Opus 5.5 (`claude-opus-5-5`) plans; Sonnet 5.5 (`claude-sonnet-5-5`) executes the build tasks. The model is recorded per entry in the logs, so the switch is visible.
- **Automatic mechanism available:** yes. Claude Code hooks (`.claude/settings.json`).

## Mechanism
- **Config file changed:** `.claude/settings.json`. `UserPromptSubmit` and `Stop` both run `node "$CLAUDE_PROJECT_DIR/.claude/hooks/capture.mjs"`.
- **Script:** `.claude/hooks/capture.mjs` (Node, no dependencies). Each run rebuilds `.agent-logs/<date>_<time>_<session-id>.md` from the session transcript JSONL. It keeps prompts verbatim and the final assistant text per turn. Thinking, tool calls and intermediate steps are excluded.
- **Log files the canaries landed in:**
  - Session 1: `.agent-logs/2026-10-04_18-40-22_98e414f1-8dee-4332-919e-2f6906ad5e10.md`
  - Session 2: `.agent-logs/2026-10-04_18-41-18_83a73aba-9175-4475-87a5-3fb974fd4a30.md`

## Canary 1 (session `98e414f1`)

```
[LOG_ENTRY type=PROMPT num=1 session=98e414f1]
timestamp: 2026-10-04T18:40:22.487Z
model: claude-sonnet-5-5

CAPTURE TEST — 8x assignment, Mohammad Ali


[LOG_ENTRY type=RESPONSE num=1 session=98e414f1]
timestamp: 2026-10-04T18:40:26.851Z
model: claude-sonnet-5-5

Capture test received. The message came through intact, and I haven't made any changes to the repo.

The `.agent-logs` file is already showing as modified in git status, so the UserPromptSubmit and Stop hooks appear to be writing. If you want, I can check that this prompt and my reply show up in the latest log.

```

## Canary 2 (session `83a73aba`, a separate session started after the first one ended)

```
[LOG_ENTRY type=PROMPT num=1 session=83a73aba]
timestamp: 2026-10-04T18:41:18.814Z
model: claude-sonnet-5-5

(session 2) CAPTURE TEST — 8x assignment, Mohammad Ali


[LOG_ENTRY type=RESPONSE num=1 session=83a73aba]
timestamp: 2026-10-04T18:41:21.232Z
model: claude-sonnet-5-5

Capture test received. Session 2 is live, and I'm ready for the 8x assignment whenever you send it.

```

## What did not work / caveats
- **The planning session predates the hook.** Hooks load when a session starts, so the first session (`50894cbe`, Opus 5.5) could not capture itself. I ran `capture.mjs` once by hand against its transcript to backfill `.agent-logs/2026-10-04_18-28-42_50894cbe-a9b6-491a-af7d-ac840822e82f.md`. The hook then kept that file up to date automatically, so its last entries were written live.
- **Turns that end on a tool call.** Prompt 2 of the planning session was interrupted after a tool call and has no final text. A first version of the script left a silent gap. It now writes `[no final text response — turn ended on a tool call]` so the gap is explicit.
- **Rejected tool calls with typed feedback.** The user's text on a rejected tool call (e.g. "Yes, and use auto mode…") is stored in a `tool_result`, not a normal user message. The script extracts it and logs it as a prompt.
- The planning session also contains the pasted assignment brief, which includes the literal text `CAPTURE TEST`. Those matches are not canaries.
