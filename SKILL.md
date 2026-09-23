---
name: skill-library
description: >
  Executable procedural workflows for AI agents operating in the
  xbox-wishlist repository. Each skill defines a named, on-demand capability
  with explicit inputs, step-by-step process logic, and mandatory
  Human-in-the-Loop pause points. Load skills only when triggered — never
  auto-execute.
version: 1.0.0
alwaysApply: false
last_reviewed: 2026-06-10
owner: "Tauriq Khan / ZellReid"
---

# 🧰 AI Skills Library — xbox-wishlist

---

## Skill: TDD Loop

```yaml
name: skill-tdd
trigger: /skill-tdd
description: >
  Executes a strict Test-Driven Development (Red-Green-Refactor) cycle.
  Use when implementing new features, fixing bugs with regression risk,
  or building any logic that requires verified test coverage.
  Note: No test framework is currently configured. Phase 1 of this skill
  includes selecting and scaffolding one if absent.
```

<skill_definition name="skill-tdd">

You are executing a rigorous Test-Driven Development workflow. You must
strictly adhere to the Red-Green-Refactor lifecycle. Deviation from the
sequential phases below is forbidden.

**Pre-conditions (verify before starting):**
- AGENTS.md has been read in full this session.
- The scope of the feature or fix is clearly defined.
- If no test framework exists: a framework must be selected and installed
  via HITL approval (AGENTS.md Section 2.7, Trigger #2) before Phase 2.

---

### Phase 1 — RED: Write Failing Tests

1. Check whether a test framework is configured (`package.json` scripts,
   `vitest.config.*`, `jest.config.*`). If none exists, halt here:

<pause_point action_required="human_approval">

```
TDD Pre-condition: No Test Framework Detected

No test framework is currently configured in xbox-wishlist.
A framework must be selected before test-driven work can proceed.

Recommended options:
  A) Vitest — aligns with planned Vite build step; fast, zero-config
  B) Jest   — widely supported, works without a bundler via jest-environment-jsdom

Reply with A or B (or specify an alternative) and I will scaffold the
configuration via HITL (AGENTS.md Trigger #2 — new dependency).
```

Halt. Do not proceed until a framework is selected and HITL-approved.

</pause_point>

2. Identify the business requirement or bug being addressed.
3. Write a comprehensive test suite covering:
   - The primary happy path
   - At minimum two edge cases or boundary conditions
   - Any error/exception path relevant to the requirement
4. Run the test suite. **Confirm the new tests fail.**

<pause_point action_required="human_approval">

```
TDD Phase 1 Complete — RED State Confirmed

New tests written : [list test names]
Test file location: [path]
Failure confirmed : [paste relevant failure output, trimmed]

Please review the test cases above.
Reply APPROVE to proceed to implementation, or provide feedback.
I will not write any implementation code until I receive explicit approval.
```

Halt. Do not proceed to Phase 2 until APPROVE is received.

</pause_point>

---

### Phase 2 — GREEN: Minimum Implementation

1. Implement the **absolute minimum** code required to make the failing
   tests pass.
2. Do not add logic beyond what the tests require.
3. Run the test suite after each meaningful code change.
4. If tests fail after 3 consecutive attempts, execute the Execution Halt
   protocol from AGENTS.md Section 1.5.
5. Continue until all new tests pass and no existing tests regress.

---

### Phase 3 — REFACTOR: Clean Without Breaking

1. Analyse the implementation for:
   - Violations of AGENTS.md prohibited patterns (Section 2.5)
   - Hard-coded Xbox class names that should use `resolveClass()`
   - New `chrome.storage.sync` calls that should be `chrome.storage.local`
   - Over-engineering or speculative abstractions
2. Refactor to resolve findings. Do not change external behaviour.
3. Re-run the full test suite after every refactoring change.

<pause_point action_required="human_approval">

```
TDD Cycle Complete — GREEN + REFACTORED

Tests passing     : [count] / [total]
Files modified    : [list]
Refactoring notes : [brief summary, or "None required"]

Awaiting final review and integration approval.
```

</pause_point>

</skill_definition>

---

## Skill: Pre-Commit Code Review

```yaml
name: skill-review
trigger: /skill-review
description: >
  Performs an exhaustive review of staged changes or a specified diff.
  Analyses for CSP violations, MV3 compliance issues, prohibited patterns,
  storage discipline, and style regressions before any commit.
  Run before every commit on changes touching the shared core, either
  platform adapter (content.js / xbox-wishlist.user.js), or manifest.json.
```

<skill_definition name="skill-review">

You are a strict senior code reviewer. Your mandate is to identify bugs,
CSP violations, MV3 compliance issues, and architectural violations before
they enter the repository. You report findings — you do not silently fix them.

**Trigger options:**
- Staged changes: `git diff --cached`
- Unstaged changes: `git diff`
- Specific file: `git diff HEAD -- browser-extension/src/shared/xbox-wishlist.core.js`
- PR comparison: `git diff main...feature/branch-name`

---

### Phase 1 — Load Diff

1. Execute the appropriate git diff command for the trigger context.
2. If no diff is found, report: "No changes detected. Nothing to review."
3. Identify all modified files and their layer (content/popup/background/manifest).

---

### Phase 2 — Multi-Pass Inspection

**Pass 1 — CSP & Extension Security**
- Inline event handlers on injected elements (`onclick=`, `onchange=`, etc.)
- `eval()`, `new Function()`, or dynamic `<script>` injection
- External script URLs injected into the page
- New host_permissions or manifest permissions added without HITL approval
- `chrome.storage.sync` calls anywhere (ISSUE-001 is resolved — all storage
  is `chrome.storage.local`; a new `.sync` call is a regression)

**Pass 2 — MV3 Compliance & Cross-Browser Compatibility**
- Service worker APIs used that are not supported in Edge or Firefox
- `chrome.*` APIs that have no `browser.*` equivalent (future Firefox compatibility)
- `manifest.json` fields that differ between Chrome and Edge MV3 spec

**Pass 3 — Architectural Integrity (AGENTS.md Section 2.3)**
- Filtering or sorting logic placed in either platform adapter
  (`content.js`, `xbox-wishlist.user.js`) instead of
  `shared/xbox-wishlist.core.js`
- A reintroduced `popup.js`/`popup.html` or `background.js` — both were
  removed as dead weight; new UI/messaging belongs in the shared core
- Hard-coded Xbox CSS class names bypassing `resolveClass()`
- DOM queries inside filter evaluation loops (should be `dataset.ifcXxx` reads)
- New files added to `browser-extension/src/` without `web_accessible_resources` update
- Hand-edits to `xbox-wishlist.user.js` itself (it's generated — see
  `tools/userscript/README.md`)

**Pass 4 — Robustness**
- Storage calls without try/catch
- Missing null checks on `resolveClass()` return values (can return `null`)
- Unhandled promise rejections on chrome API calls
- `console.error` missing on catch blocks in the shared core's initialization paths

**Pass 5 — Style & Standards (AGENTS.md Section 2.4)**
- Naming convention violations (`ifc_` IDs, `ifc-` classes, `data-ifc-` attributes)
- String concatenation instead of template literals
- Formatting regressions (4-space indent, single quotes, semicolons)

---

### Phase 3 — Report Generation

```markdown
## Pre-Commit Review Report

**Reviewed Scope:** [files / diff range]
**Review Date    :** [date]
**Total Findings :** [count]

---

### [CRITICAL] [File: path/to/file.js, Line: NN]
**Vector:** [CSP / MV3 / Architecture / Robustness / Style]
**Issue:** [One sentence description]
**Risk:** [Why this matters]
**Remediation:**
\`\`\`javascript
// ❌ Current
[problematic code]

// ✅ Recommended
[fixed code]
\`\`\`
```

Severity definitions:
- **CRITICAL** — CSP violation, extension breakage, or data integrity risk. Block commit.
- **HIGH** — Architectural violation or MV3 non-compliance. Strong recommendation to fix.
- **MEDIUM** — Robustness gap or ISSUE-001 compliance failure. Should fix before commit.
- **LOW** — Style or minor standards deviation. Fix if easy.
- **INFO** — Observation only. No action required.

<pause_point action_required="human_approval">

Output the complete review report, then output exactly:

```
Pre-Commit Review Complete.

Summary:
  CRITICAL : [count]
  HIGH     : [count]
  MEDIUM   : [count]
  LOW      : [count]
  INFO     : [count]

Reply APPLY to have me remediate all CRITICAL and HIGH findings automatically.
Reply IGNORE to proceed with the commit as-is (not recommended if CRITICAL > 0).
Reply SELECTIVE [list finding numbers] to remediate specific findings only.
```

Halt. Do not modify any file until a reply is received.

</pause_point>

---

### Phase 4 — Conditional Remediation

**If APPLY received:**
1. Remediate all CRITICAL and HIGH findings surgically (follow AGENTS.md 1.3).
2. Load the extension unpacked and verify no new console errors.
3. Report each file modified and the specific change made.

**If SELECTIVE received:**
1. Remediate only the numbered findings specified.
2. Verify no console errors introduced.
3. Report changes made.

**If IGNORE received:**
1. Acknowledge and close the skill. No changes made.

</skill_definition>

---

## Skill: Architecture Design

```yaml
name: skill-arch
trigger: /skill-arch
description: >
  Generates a structured Architecture Decision Record (ADR) before any
  implementation begins on a major feature, complex refactor, or new module.
  Always run before starting work that touches manifest.json, introduces a
  new chrome API, or changes the popup ↔ content script message contract.
```

<skill_definition name="skill-arch">

You are acting as a Principal Systems Architect for a browser extension.
Your objective is to translate the feature request into a technically rigorous
design document **before** any implementation code is written.

---

### Phase 1 — Requirement Analysis

1. Restate the feature request in your own words to confirm understanding.
2. Identify which files will be affected (shared/xbox-wishlist.core.js /
   content.js / xbox-wishlist.user.js / manifest.json / shared/styles.css).
3. Identify any HITL triggers this feature will invoke (AGENTS.md Section 2.7).
4. Flag any ambiguities that need human clarification before design proceeds.
   If any exist, halt here and ask.

---

### Phase 2 — Architecture Document Draft

```markdown
## ADR: [Feature Name]
**Date:** [date]
**Status:** Draft — Awaiting Approval

### Context
[Problem statement and requirement — 2–4 sentences]

### Proposed Solution
[High-level approach — which files, which patterns, why]

### Affected Components
| File | Change Type | Notes |
|------|-------------|-------|
| [file] | [Add / Modify / Delete] | [brief note] |

### Chrome API Changes
[New chrome.* APIs required — or "None"]
[Trigger HITL block per AGENTS.md 2.7 #2 if new permissions required]

### Message Contract Changes
[New or modified chrome.runtime.sendMessage action names / shapes — or "None"]
[Trigger HITL block per AGENTS.md 2.7 #5 if any contract change]

### Manifest Changes
[Any manifest.json edits required — or "None"]
[Trigger HITL block per AGENTS.md 2.7 #10 for any manifest change]

### Storage Impact
[Does this feature touch storage calls? If yes, confirm it uses
`chrome.storage.local` only — ISSUE-001 (the old sync/local split) is
resolved; a new `.sync` call would reopen it.]

### Security Considerations
[CSP compliance, new host_permissions, web_accessible_resources updates]

### Cross-Browser Compatibility
[Will this work on Edge without changes? Any Firefox concerns for future?]

### Implementation Task Breakdown
1. [Task 1 — file, what changes]
2. [Task 2]
3. [Task 3]
```

<pause_point action_required="human_approval">

Output the complete ADR, then output exactly:

```
Architecture Draft Complete.

Please review the ADR, particularly:
  - Affected components list
  - Chrome API / permission changes (HITL required if any)
  - Manifest changes (HITL required if any)
  - Message contract changes
  - Storage impact

Reply APPROVE to proceed to implementation planning.
Reply REVISE [feedback] to adjust the architecture before proceeding.
I will not write any implementation code until I receive APPROVE.
```

Halt. Do not proceed until APPROVE is received.

</pause_point>

---

### Phase 3 — Finalisation

1. Incorporate feedback into the ADR.
2. Output the final, approved task breakdown as a numbered checklist.
3. Confirm which skill to invoke next (typically `/skill-tdd` or
   `/skill-scaffold-feature`).

</skill_definition>

---

## Skill: Scaffold Content Script Feature

```yaml
name: skill-scaffold-feature
trigger: /skill-scaffold-feature
description: >
  End-to-end scaffold for a new filter criterion, sort criterion, or UI
  enhancement in the shared core (shared/xbox-wishlist.core.js). Follows the
  existing state/config/DOM injection patterns exactly so new features are
  structurally consistent with the codebase, and land automatically in both
  the extension and the userscript. Use whenever adding a new filter option,
  sort field, or injected UI control.
```

<skill_definition name="skill-scaffold-feature">

You are scaffolding a new feature in shared/xbox-wishlist.core.js — never in
content.js or xbox-wishlist.user.js, which are thin per-platform adapters
only (see AGENTS.md §2.3). You must follow the existing architectural
patterns exactly — no new abstractions, no structural deviations. If the
feature is userscript-only, remember xbox-wishlist.user.js is generated
(`tools/userscript/build.js`) — rebuild it after editing the core, never
hand-edit it.

**Pre-conditions:**
- AGENTS.md has been read in full this session.
- The feature type has been confirmed: filter criterion / sort criterion / UI control.
- `/skill-arch` has been run if the feature touches manifest.json or a chrome API.

---

### Phase 1 — Pattern Mapping

1. Identify which existing feature is most structurally similar to the new one.
   Read only the relevant section of `shared/xbox-wishlist.core.js` (use line ranges).
2. Extract the pattern:
   - State slot in `state.filters` or `state.sort.fields`
   - Config slot in `CONFIG.ids` or `CONFIG.selectors`
   - DOM injection call chain
   - Filter evaluation in `shouldShowContainer()` or sort comparator
   - Storage serialisation in `saveFilterState()` / `loadFilterState()`
3. List the exact locations (line numbers) where new code must be inserted.

<pause_point action_required="human_approval">

```
Scaffold Phase 1 Complete — Pattern Mapped

Similar existing feature : [name]
State slot location      : shared/xbox-wishlist.core.js line [N]
Config slot location     : shared/xbox-wishlist.core.js line [N]
DOM injection location   : shared/xbox-wishlist.core.js line [N]
Filter/sort eval location: shared/xbox-wishlist.core.js line [N]
Storage location         : shared/xbox-wishlist.core.js line [N]

Proposed insertions:
[numbered list of each change with file + line]

Reply APPROVE to proceed to scaffolding, or provide corrections.
```

Halt. Do not write any code until APPROVE is received.

</pause_point>

---

### Phase 2 — Code Generation

1. Generate each insertion as a targeted diff, following the exact style
   of adjacent code (indentation, quotes, naming conventions).
2. Verify:
   - State property uses camelCase under the correct `state.*` path.
   - Config ID uses `ifc_` prefix.
   - Any injected CSS classes use `ifc-` prefix.
   - Any `data-*` attributes use `data-ifc-` prefix.
   - No `chrome.storage.sync` calls introduced.
   - No hard-coded Xbox class names.
3. Apply changes surgically (AGENTS.md Section 1.3).

<pause_point action_required="human_approval">

```
Scaffold Phase 2 Complete — Code Generated

Files modified : [list]
Lines changed  : [summary per file]
Storage check  : No new chrome.storage.sync calls introduced ✅

If xbox-wishlist.user.js needed a change, confirm `node tools/userscript/build.js`
was run afterward rather than hand-editing the generated file.

Please load the extension unpacked and verify the new feature.
Reply APPROVE to close the skill, or REVISE [feedback] to adjust.
```

</pause_point>

</skill_definition>

---

## Skill: Fix ISSUE-001 Storage Split

**✅ RESOLVED, and now moot.** ISSUE-001 (the `chrome.storage.sync`/
`chrome.storage.local` split between `popup.js` and the core) was fixed by
switching `popup.js` to `chrome.storage.local`. `popup.js`/`popup.html`/
`background.js` have since been deleted entirely (unused, dead-on-arrival
feature), so there's no longer a second storage-writing file to drift out
of sync in the first place. This skill definition is kept below purely as
a template for any future storage-consolidation task; don't run it
expecting these files to exist.

```yaml
name: skill-fix-storage
trigger: /skill-fix-storage
description: >
  [Historical - ISSUE-001 is resolved.] Coordinated fix that consolidated
  chrome.storage.sync usage in popup.js to chrome.storage.local, aligning it
  with the canonical storage strategy in the shared core. Kept as a template
  for any future storage-consolidation task.
```

<skill_definition name="skill-fix-storage">

You are executing a targeted, isolated storage-consolidation fix. This is a
**storage-only change** — no filtering logic, no UI changes, no other fixes
bundled into this task.

**Pre-conditions:**
- AGENTS.md has been read in full this session.
- No other uncommitted changes are present (`git status` is clean).
- The user has confirmed this is the right time to tackle ISSUE-001.

---

### Phase 1 — Audit

1. Read all `chrome.storage` calls in `popup.js` (full file — it is short).
2. Read all `chrome.storage` calls in `content.js` (grep for `chrome.storage`).
3. Produce a complete inventory:

```
ISSUE-001 Storage Audit

popup.js:
  Line [N]: chrome.storage.sync.set({ persistFilters: ... })
  Line [N]: chrome.storage.sync.get(['persistFilters'], ...)

content.js:
  Line [N]: chrome.storage.local.get(CONFIG.storage.key, ...)
  Line [N]: chrome.storage.local.set({ [CONFIG.storage.key]: ... })

Storage key used in content.js: [CONFIG.storage.key value]
Storage key used in popup.js  : 'persistFilters' (currently in .sync)
```

<pause_point action_required="human_approval">

```
ISSUE-001 Audit Complete.

[paste the audit block above]

Proposed fix:
  Replace all chrome.storage.sync calls in popup.js with chrome.storage.local.
  The persistFilters key will move to chrome.storage.local alongside the main
  filter state. No content.js changes required.

Reply APPROVE to apply the fix.
Reply DISCUSS to talk through an alternative approach first.
```

Halt. Do not modify any file until APPROVE is received.

</pause_point>

---

### Phase 2 — Apply Fix

1. In `popup.js`, replace every `chrome.storage.sync` call with
   `chrome.storage.local`. Keys and callback shapes remain identical.
2. Verify the fix surgically — touch only the storage API name, nothing else.
3. Confirm `git diff` shows only the intended lines changed.

<pause_point action_required="human_approval">

```
ISSUE-001 Fix Applied.

Files modified : popup.js
Lines changed  :
  Line [N]: chrome.storage.sync.set → chrome.storage.local.set
  Line [N]: chrome.storage.sync.get → chrome.storage.local.get

git diff confirms only the above lines were touched.

Please load the extension unpacked, toggle the persist-filters checkbox,
and verify the setting is saved and restored correctly.

Reply APPROVE to close the skill and mark ISSUE-001 resolved.
Reply REVERT if verification failed.
```

</pause_point>

</skill_definition>

---

## Skill: Build Pipeline Setup

```yaml
name: skill-build-setup
trigger: /skill-build-setup
description: >
  Introduces a Vite or esbuild build step to xbox-wishlist, adding package.json,
  configuring the bundler, and updating the load/deploy path from
  browser-extension/src/ to a dist/ output directory. This is a HITL-gated
  multi-phase task — do not run inline with feature work.
```

<skill_definition name="skill-build-setup">

You are setting up the build pipeline for xbox-wishlist. This is an
**infrastructure-only change** — no feature code is modified.
Every step is HITL-gated because this changes how the extension is loaded,
tested, and distributed.

**Pre-conditions:**
- AGENTS.md has been read in full this session.
- `git status` is clean — no uncommitted feature changes.
- HITL Trigger #11 (Build pipeline introduction) has been acknowledged.

---

### Phase 1 — Design

1. Confirm the bundler choice: Vite (recommended — aligns with planned build
   direction) or esbuild (lighter, no dev server).
2. Identify all files in `browser-extension/src/` that will be inputs.
3. Draft the proposed `package.json` and bundler config.
4. Identify any IIFE patterns in shared/xbox-wishlist.core.js, content.js, or
   xbox-wishlist.user.js that may need adjustment for module bundling (e.g.
   `window.injected = state` and `window.XboxWishlistCore` globals).

<pause_point action_required="human_approval">

```
Build Setup Phase 1 Complete — Design Draft

Bundler          : [Vite / esbuild]
Entry points     : [list]
Output directory : browser-extension/dist/
package.json     : [paste proposed content]
Bundler config   : [paste proposed config]

Content.js notes : [any IIFE / module compatibility concerns]

Reply APPROVE to proceed to scaffolding.
Reply REVISE [feedback] to adjust before proceeding.
```

Halt. Do not create any files until APPROVE is received.

</pause_point>

---

### Phase 2 — Scaffold

1. Create `package.json` at repo root with build/dev scripts.
2. Create the bundler config file.
3. Update `.gitignore` to exclude `node_modules/` and `browser-extension/dist/`.
4. Add a `browser-extension/dist/` entry to `.gitignore`.
5. Do **not** move or rename any source files — the build step reads from
   `browser-extension/src/` and writes to `browser-extension/dist/`.

<pause_point action_required="human_approval">

```
Build Setup Phase 2 Complete — Files Scaffolded

Files created:
  package.json
  [bundler config file]
  .gitignore (updated)

Next steps:
  1. Run: npm install
  2. Run: npm run build
  3. Load unpacked from browser-extension/dist/ (not src/)
  4. Verify extension loads and functions correctly in Chrome and Edge.

Reply APPROVE after verifying, or REVERT if the build fails.
```

</pause_point>

</skill_definition>
