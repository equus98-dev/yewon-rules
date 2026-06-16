<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:git-push-rule -->
# AI Agent Workflow Rule: Auto Git Push
Whenever you make changes to the source code or fix a bug in this project, you MUST ALWAYS execute `git add`, `git commit -m "..."`, and `git push origin main` at the end of your workflow so that the changes are automatically deployed to the production server. Do not wait for the user to remind you!
<!-- END:git-push-rule -->

<!-- BEGIN:korean-language-rule -->
# AI Agent Workflow Rule: Korean Language
You MUST always communicate and respond to the USER in Korean (한국어). 
Do NOT reply in English unless specifically asked to translate or output English code/text.
<!-- END:korean-language-rule -->

<!-- BEGIN:lesson-learned-html-bypass-and-syntax -->
# AI Agent Workflow Rule: Lessons Learned
1. **HTML Bypass in React**: If a component renders raw HTML using `dangerouslySetInnerHTML`, remember that any text formatting logic applied to JSON/text props will be completely bypassed. You MUST apply formatting logic to both the JSON/text rendering path AND the HTML string manipulation path.
2. **Syntax Errors on File Edit**: When using `replace_file_content` to edit code, ALWAYS double-check that you are not accidentally deleting closing braces (`}`) of outer `if` blocks or functions. Verify the context of your replacement strictly.
<!-- END:lesson-learned-html-bypass-and-syntax -->
