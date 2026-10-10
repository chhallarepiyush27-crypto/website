# Publish a Friday Note

1. Open this repository on GitHub and go to `_posts/`.
2. Use **Add file → Create new file**. Name it `YYYY-MM-DD-short-title.md`, using the Friday you publish it. For example, `2026-09-25-a-new-chapter.md`.
3. Copy the structure from `_posts/POST_TEMPLATE.txt`. Replace its title, date, category, excerpt, and body with your own writing. The date in the filename must match the `date:` line.
4. Click **Commit changes** to `main`. GitHub Pages will build the new article, put it at the top of [the blog](https://chhallarepiyush27.com/blog.html), feature a preview on the homepage, and create its own shareable link. The live update may take a few minutes.

Write in Markdown: `## Heading`, `**bold**`, `[link](https://example.com)`, and `![alt text](../images/photo.jpeg)` all work. To use a new photo, upload it into the repository's `images/` folder and use its exact filename.

You can also send me your draft and photos, and I can publish them for you. The Friday schedule is editorial: nothing posts itself until you commit a note.

## Inline comments, likes, and sharing

Every article uses the shared post layout with an embedded Giscus panel. Readers compose comments and add reactions directly in the article; GitHub authentication is required once. Pathname mapping keeps each post's conversation separate. The Share menu stays within the article and supports app links, Copy link, and native sharing where available.

### One-time activation

1. Enable Discussions in the website repository's Settings → General → Features.
2. Install https://github.com/apps/giscus for **only** chhallarepiyush27-crypto/website. Review the requested Discussions permissions.
3. On https://giscus.app select this repository and its Announcements category. Set pathname mapping, strict matching, reactions enabled, and input position top.
4. Copy data-category-id into giscus_category_id in _config.yml. Keep the repository ID already configured in the template.
5. Publish the inline-comments changes. Verify posting and reacting in the embedded panel before reporting activation complete.

The old issue threads remain available for migration. Convert existing reader threads to Discussions and match their titles to the article pathname if comments need to be retained. No existing comments are deleted by this change. The legacy thread-creation workflow is disabled after activation.
