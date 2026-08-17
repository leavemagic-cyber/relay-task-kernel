# Forbidden Actions

Do not:

- read `.env`, `.env.local`, token files, credentials, SSH keys, or secret stores
- print secrets, deployment identifiers, or private URLs into reports
- run `git reset --hard`, force pushes, destructive deletes, or broad cleanup
  commands without explicit approval
- push, deploy, publish, or otherwise change production state unless asked
- scan the whole repository by default
- rewrite files unrelated to the current task
- promote draft or preview content to published without explicit approval
- make irreversible changes without stating the blast radius first

If a risky action looks necessary, stop and ask. The cost of one clarifying
question is far below the cost of an unwanted production change.
