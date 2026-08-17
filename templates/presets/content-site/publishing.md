# Publishing Gate - {{PROJECT_NAME}}

A new draft is never published by an agent. The gate is:

1. Draft lands with a non-published status.
2. Agent runs the site locally and {{OWNER}} looks at the rendered page.
3. {{OWNER}} says explicitly that it ships.
4. Only then may the status change, and only then may it be pushed to
   `{{PRODUCTION_BRANCH}}`.

Skipping step 2 is the failure mode this gate exists for: frontmatter that
validates fine and renders wrong.

## Preview Without Leaking

Draft items must be openable locally while staying invisible in production.
That normally means all three of: a non-published status, `noindex`, and
exclusion from the sitemap.

<!-- TODO: name the exact fields and the function that enforces them in this
     repo, so an agent can verify rather than guess. -->
