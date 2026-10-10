# Publish a Friday Note

1. Open this repository on GitHub and go to `_posts/`.
2. Use **Add file → Create new file**. Name it `YYYY-MM-DD-short-title.md`, using the Friday you publish it. For example, `2026-09-25-a-new-chapter.md`.
3. Copy the structure from `_posts/POST_TEMPLATE.txt`. Replace its title, date, category, excerpt, and body with your own writing. The date in the filename must match the `date:` line.
4. Click **Commit changes** to `main`. GitHub Pages will build the new article, put it at the top of [the blog](https://chhallarepiyush27.com/blog.html), feature a preview on the homepage, and create its own shareable link. The live update may take a few minutes.

Write in Markdown: `## Heading`, `**bold**`, `[link](https://example.com)`, and `![alt text](../images/photo.jpeg)` all work. To use a new photo, upload it into the repository's `images/` folder and use its exact filename.

You can also send me your draft and photos, and I can publish them for you. The Friday schedule is editorial: nothing posts itself until you commit a note.

## Comments, likes, and sharing on every post

All posts use the shared `post` layout automatically. Every article and archive card has Comment, Like, and Share controls. Sharing offers app links, Copy link, and the device's native app chooser where available.

The `post-conversations` workflow creates one public GitHub issue per published post when Markdown posts are added or updated on main. It reuses an existing thread whose body links to the exact article URL. The page finds that thread automatically; no comment ID or Giscus installation is needed. Readers sign in to GitHub to comment or add a heart/thumbs-up, and the page displays that article's comments and like count. The GitHub workflow token is used only inside Actions; no token is shipped to the website.

If a post has a custom `permalink`, keep it as a literal absolute path beginning with `/`. When changing a published URL, move the existing thread's article link to the new URL to preserve comments.
