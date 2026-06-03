<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-push-rule -->
# AI Agent Workflow Rule: Auto Git Push
Whenever you make changes to the source code or fix a bug in this project, you MUST ALWAYS execute `git add`, `git commit -m "..."`, and `git push origin main` at the end of your workflow so that the changes are automatically deployed to the production server. Do not wait for the user to remind you!
<!-- END:git-push-rule -->
