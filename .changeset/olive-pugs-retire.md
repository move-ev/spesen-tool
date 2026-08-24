---
"@zemio/web": minor
---

Remove the agentation dev overlay from the web app and drop its pinned agent
skills.

The overlay mounted only under `NODE_ENV=development` and talked to a local
endpoint on port 4747, so no deployed build ever rendered it. Removing the
package takes the import and the conditional mount in the root layout with it.

`skills-lock.json` also pinned two skills from the same upstream —
`agentation` and `agentation-self-driving`. With the package gone those were
dead config that could still point an agent at an overlay that no longer
exists, so they are removed too. Nothing to change in any environment.
