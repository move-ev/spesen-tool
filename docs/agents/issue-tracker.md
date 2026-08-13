# Issue tracker: Linear

Issues and specs for this repo live in Linear, in the **Development** team
(`cb577898-b279-48a3-aeb3-51a8287e85fa`). All operations go through the Linear
MCP server — there is no CLI. The GitHub repo at `zemio-co/zemio` is used for
code and pull requests only; its Issues tab is not a tracker.

Linear tools are deferred: load a schema with
`ToolSearch("select:mcp__linear-server__<name>")` before calling it.

## Starting work on an issue

**Always work on the branch Linear provides.** Every Linear issue carries a
`gitBranchName` — read it with
`get_issue`, or `list_issues({fields: ["id", "title", "gitBranchName"]})` — and
check out exactly that name before writing any code:

```bash
git switch -c "<gitBranchName>"   # or: git switch "<gitBranchName>" if it exists
```

Linear matches branches by name, so using it is what links the branch, its
commits, and the eventual pull request back to the issue automatically. Inventing
your own branch name silently breaks that link, and no amount of referencing the
issue in the PR body restores it.

When work happens in a git worktree, create the worktree on that branch rather
than renaming it afterwards.

## Conventions

- **Create an issue**: `save_issue` with `team: "Development"`, `title`, and
  `description` (Markdown, literal newlines — do not escape).
- **Update an issue**: `save_issue` with `id` set to the identifier (e.g. `DEV-42`).
  Prefer `patch` over rewriting `description` wholesale.
- **Read an issue**: `get_issue`, plus `list_comments` for the discussion.
- **List issues**: `list_issues` with `team`, `state`, `label`, or `assignee`
  filters. Use `fields` to request only what is needed.
- **Comment**: `save_comment`.
- **Labels**: `labels` on `save_issue` — note it *replaces* the full label set,
  so read the current labels first when adding one. New labels are created with
  `create_issue_label`.
- **Close**: `save_issue` with `state: "Done"` (or `"Canceled"` for wontfix).

## Blocking relations

Linear models these natively, and they are the canonical representation:

- **Add a blocker**: `save_issue` with `blockedBy: ["DEV-41"]` (append-only).
- **Declare what an issue blocks**: `blocks: ["DEV-43"]`.
- **Remove**: `removeBlockedBy` / `removeBlocks`.
- **Parent/child**: `parentId`, with `list_issues({parentId})` to enumerate children.

A ticket is unblocked when every issue in its `blockedBy` set is Done or Canceled.

## Pull requests as a triage surface

**PRs as a triage surface: no.** _(Set to `yes` if external GitHub PRs should
enter the triage queue; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in the Development team.

## When a skill says "fetch the relevant ticket"

`get_issue` on the identifier, followed by `list_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue; tickets are its children.

- **Map**: an issue labelled `wayfinder:map` holding the Notes / Decisions-so-far
  / Fog body.
- **Child ticket**: `save_issue` with `parentId` set to the map, labelled
  `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`).
- **Blocking**: `blockedBy` / `blocks` as above.
- **Frontier query**: `list_issues({parentId: <map>, state: ...})`, dropping any
  issue with an unresolved `blockedBy` or an assignee; first in map order wins.
- **Claim**: `save_issue` with `assignee: "me"` — the session's first write.
- **Resolve**: `save_comment` with the answer, `save_issue` to Done, then append
  a pointer to the map's Decisions-so-far via `patch`.
