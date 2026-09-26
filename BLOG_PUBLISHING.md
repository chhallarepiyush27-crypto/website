# Publish a Friday Note

1. Open this repository on GitHub and go to `_posts/`.
2. Use **Add file → Create new file**. Name it `YYYY-MM-DD-short-title.md`, using the Friday you publish it. For example, `2026-09-25-a-new-chapter.md`.
3. Copy the structure from `_posts/POST_TEMPLATE.txt`. Replace its title, date, category, excerpt, and body with your own writing. The date in the filename must match the `date:` line.
4. Click **Commit changes** to `main`. GitHub Pages will build the new article, put it at the top of [the blog](https://chhallarepiyush27.com/blog.html), feature a preview on the homepage, and create its own shareable link. The live update may take a few minutes.

Write in Markdown: `## Heading`, `**bold**`, `[link](https://example.com)`, and `![alt text](../images/photo.jpeg)` all work. To use a new photo, upload it into the repository's `images/` folder and use its exact filename.

You can also send me your draft and photos, and I can publish them for you. The Friday schedule is editorial: nothing posts itself until you commit a note.

## Enable comments and reactions

The post template has a Giscus discussion area. For it to become active, enable **Discussions** in this repository's **Settings → General → Features**, install the [Giscus GitHub App](https://github.com/apps/giscus) for this public repository, and choose the **Announcements** category on [giscus.app](https://giscus.app/). Copy the generated `data-category-id` into `giscus_category_id` in `_config.yml` and commit. Visitors then use GitHub sign in to comment or react on each post. Leave the value blank until setup is complete; no broken discussion box is displayed.
