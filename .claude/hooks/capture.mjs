#!/usr/bin/env node
// Agent capture hook for the 8x assignment.
//
// Wired to UserPromptSubmit and Stop in .claude/settings.json. Each run
// rebuilds .agent-logs/<date>_<time>_<session>.md from the session transcript
// (an append-only JSONL file written by Claude Code), so the log is always a
// deterministic projection of the raw record: user prompts verbatim, and the
// final assistant text of each turn. Thinking, tool calls and intermediate
// steps are deliberately excluded.

import fs from "node:fs";
import path from "node:path";

const AUTHOR = "mohammadali83123";
const TOOL = "claude-code";
const PROJECT = "amazon-clone";
const INTERRUPT = "[Request interrupted by user";
const FEEDBACK_MARKER = "the user said:\n";

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, "utf8") || "{}");
  } catch {
    return {};
  }
}

function readTranscript(p) {
  if (!p || !fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const isLocalCommand = (s) =>
  /^\s*<(command-name|command-message|local-command-stdout|local-command-caveat|local-command-stderr)>/.test(s);

// Returns the user-authored text of an entry, or null if it isn't a prompt.
function promptText(e) {
  if (e.type !== "user" || e.isMeta || e.isSidechain) return null;
  const c = e.message?.content;
  if (typeof c === "string") return isLocalCommand(c) ? null : c;
  if (!Array.isArray(c)) return null;
  // A rejected tool call carrying typed feedback is the user talking to the agent.
  const tr = c.find((b) => b.type === "tool_result");
  if (tr) {
    const body = typeof tr.content === "string" ? tr.content : (tr.content || []).map((b) => b.text || "").join("");
    const i = body.indexOf(FEEDBACK_MARKER);
    return tr.is_error && i !== -1 ? body.slice(i + FEEDBACK_MARKER.length) : null;
  }
  const text = c.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  if (!text || text.startsWith(INTERRUPT) || isLocalCommand(text)) return null;
  return text;
}

function isInterrupt(e) {
  const c = e.message?.content;
  return e.type === "user" && Array.isArray(c) && c.some((b) => b.type === "text" && b.text?.startsWith(INTERRUPT));
}

function buildExchanges(entries) {
  const turns = [];
  let cur = null;
  for (const e of entries) {
    if (e.isSidechain) continue;
    const p = promptText(e);
    if (p !== null) {
      cur = { prompt: p, promptTime: e.timestamp, events: [], interrupted: false };
      turns.push(cur);
      continue;
    }
    if (!cur) continue;
    if (isInterrupt(e)) cur.interrupted = true;
    if (e.type === "assistant" && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b.type === "text" || b.type === "tool_use") {
          cur.events.push({ kind: b.type, text: b.text, time: e.timestamp, model: e.message.model });
        }
      }
    }
  }
  let lastModel = null;
  return turns.map((t) => {
    // Final response = the text emitted after the turn's last tool call.
    let lastTool = -1;
    t.events.forEach((ev, i) => ev.kind === "tool_use" && (lastTool = i));
    const finals = t.events.slice(lastTool + 1).filter((ev) => ev.kind === "text" && ev.text?.trim());
    const anyModel = t.events.find((ev) => ev.model && ev.model !== "<synthetic>")?.model;
    const model = finals.at(-1)?.model || anyModel || lastModel || "unknown";
    lastModel = model;
    let response = finals.map((ev) => ev.text).join("\n\n");
    if (t.interrupted) response = (response ? response + "\n\n" : "") + "[turn interrupted by user]";
    return {
      prompt: t.prompt,
      promptTime: t.promptTime,
      promptModel: anyModel || model,
      response,
      responseTime: finals.at(-1)?.time || null,
      model,
    };
  });
}

function render(sessionId, ex) {
  const short = sessionId.slice(0, 8);
  const first = ex[0].promptTime;
  const last = ex.at(-1).promptTime;
  const models = [...new Set(ex.flatMap((x) => [x.promptModel, x.model]).filter((m) => m && m !== "unknown"))];
  const out = [
    "---",
    `session_id: ${sessionId}`,
    `date: ${first.slice(0, 10)}`,
    `author: ${AUTHOR}`,
    `model: ${models.join(", ") || "unknown"}`,
    `tool: ${TOOL}`,
    `project: ${PROJECT}`,
    `total_exchanges: ${ex.length}`,
    `first_prompt_time: ${first}`,
    `last_prompt_time: ${last}`,
    "---",
    "",
    `# Session Log - ${first.slice(0, 10)}`,
    "",
    `Session: \`${short}\` | Project: \`${PROJECT}\` | Author: \`${AUTHOR}\``,
    "",
    "---",
    "",
  ];
  ex.forEach((x, i) => {
    const n = i + 1;
    out.push(`[LOG_ENTRY type=PROMPT num=${n} session=${short}]`, `timestamp: ${x.promptTime}`, `model: ${x.promptModel}`, "", x.prompt, "", "");
    // A turn that ended on a tool call (e.g. a rejected one) has no final text; say so
    // explicitly rather than leaving a silent gap. The still-running last turn is left open.
    const response = x.response || (i < ex.length - 1 ? "[no final text response — turn ended on a tool call]" : "");
    if (response) {
      out.push(`[LOG_ENTRY type=RESPONSE num=${n} session=${short}]`, `timestamp: ${x.responseTime || x.promptTime}`, `model: ${x.model}`, "", response, "", "");
    }
  });
  return out.join("\n");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const input = readStdin();
  const transcript = input.transcript_path || process.argv[2];
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  let entries = readTranscript(transcript);
  let ex = buildExchanges(entries);

  // On Stop, the final message can land in the transcript a moment after the hook fires.
  if (input.hook_event_name === "Stop") {
    for (let i = 0; i < 10 && ex.length && !ex.at(-1).response; i++) {
      await sleep(200);
      ex = buildExchanges(readTranscript(transcript));
    }
    if (ex.length && !ex.at(-1).response && input.last_assistant_message) {
      ex.at(-1).response = input.last_assistant_message;
      ex.at(-1).responseTime = new Date().toISOString();
    }
  }

  // On UserPromptSubmit, the new prompt may not be in the transcript yet.
  if (input.hook_event_name === "UserPromptSubmit" && input.prompt) {
    if (!ex.length || ex.at(-1).prompt !== input.prompt) {
      const m = ex.at(-1)?.model || "unknown";
      ex.push({ prompt: input.prompt, promptTime: new Date().toISOString(), promptModel: m, response: "", model: m });
    }
  }

  if (!ex.length) return;
  const sessionId = input.session_id || path.basename(transcript, ".jsonl");
  const stamp = ex[0].promptTime.slice(0, 19).replace("T", "_").replace(/:/g, "-");
  const dir = path.join(projectDir, ".agent-logs");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${stamp}_${sessionId}.md`), render(sessionId, ex));
}

main().catch((err) => {
  // Never block the agent on a logging failure; record it instead.
  try {
    const dir = path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), ".agent-logs");
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, "capture-errors.log"), `${new Date().toISOString()} ${err.stack}\n`);
  } catch {}
});
