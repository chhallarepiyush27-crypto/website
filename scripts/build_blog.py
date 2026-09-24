"""Build the static Friday Notes archive and article pages from _posts/*.md."""

from datetime import date
from html import escape
from pathlib import Path
import re
import shutil

import markdown


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / ".site-build"
START = "<!-- BLOG_POSTS_START -->"
END = "<!-- BLOG_POSTS_END -->"


def read_post(path):
    source = path.read_text(encoding="utf-8")
    header, separator, body = source.partition("\n---\n")
    if not separator or not header.startswith("---\n"):
        raise ValueError(f"{path.name}: add a --- metadata block at the top")
    meta = {}
    for line in header.splitlines()[1:]:
        if ":" not in line:
            raise ValueError(f"{path.name}: invalid metadata line: {line}")
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip('"').strip("'")
    for required in ("title", "date", "category", "excerpt"):
        if not meta.get(required):
            raise ValueError(f"{path.name}: missing {required}")
    published = date.fromisoformat(meta["date"])
    slug = path.stem
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}-[a-z0-9-]+", slug):
        raise ValueError(f"{path.name}: use YYYY-MM-DD-short-title.md")
    if slug[:10] != meta["date"]:
        raise ValueError(f"{path.name}: filename date and metadata date differ")
    return {"slug": slug, "date": published, "title": meta["title"],
            "category": meta["category"], "excerpt": meta["excerpt"], "body": body}


def article(post):
    title = escape(post["title"])
    category = escape(post["category"])
    excerpt = escape(post["excerpt"])
    when = post["date"].strftime("%B %-d, %Y")
    body = markdown.markdown(post["body"], extensions=["extra", "sane_lists"])
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#101b29"><meta name="description" content="{excerpt}"><title>{title} — Friday Notes by Piyush Chhallare</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/css/portfolio.css"><script src="../assets/js/portfolio.js" defer></script></head>
<body><header class="site-header scrolled" id="site-header"><nav class="nav wrap" aria-label="Main navigation"><a class="brand" href="../index.html">Piyush Chhallare<span>.</span></a><button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">☰</button><div class="nav-links" id="nav-links"><a href="../index.html">Home</a><a href="../researchexperience.html">Research</a><a href="../myprojects.html">Projects</a><a href="../aboutme.html">About</a><a href="../blog.html" aria-current="page">Blog</a><a href="../certificates.html">Certifications</a><a class="nav-cta" href="../contactme.html">Get in touch ↗</a></div></nav></header>
<main class="blog-article"><section class="blog-article-header"><div class="wrap"><a class="blog-back" href="../blog.html">← All Friday Notes</a><span class="eyebrow">{category} · <time datetime="{post['date'].isoformat()}">{when}</time></span><h1>{title}</h1><p>{excerpt}</p></div></section><div class="wrap"><article class="blog-article-body">{body}<div class="blog-article-footer"><a class="arrow-link" href="../blog.html">← Back to the blog</a></div></article></div></main>
<footer class="page-footer"><div class="wrap"><span>© <span id="year">{date.today().year}</span> Piyush Chhallare · Physics · Devices · Circuits</span><span><a href="https://github.com/chhallarepiyush27-crypto" target="_blank" rel="noopener noreferrer">GitHub ↗</a> &nbsp;·&nbsp; <a href="https://www.linkedin.com/in/piyush-chhallare-b49920227/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></span></div></footer></body></html>'''


def main():
    posts = sorted((read_post(p) for p in (ROOT / "_posts").glob("*.md")),
                   key=lambda p: (p["date"], p["slug"]), reverse=True)
    if DEST.exists():
        shutil.rmtree(DEST)
    shutil.copytree(ROOT, DEST, ignore=shutil.ignore_patterns(
        ".git", ".github", ".site-build", "scripts", "_posts", "BLOG_PUBLISHING.md",
        "*.pyc", "__pycache__"))
    if posts:
        cards = ['<div class="blog-post-grid">']
        for post in posts:
            title = escape(post["title"])
            href = "posts/" + post["slug"] + ".html"
            when = post["date"].strftime("%B %-d, %Y")
            cards.append(f'<article class="blog-post-card"><span class="blog-post-meta">{escape(post["category"])} · <time datetime="{post["date"].isoformat()}">{when}</time></span><h3>{title}</h3><p>{escape(post["excerpt"])}</p><a href="{href}" aria-label="Read {title}">Read the note ↗</a></article>')
        cards.append("</div>")
        listing = "\n".join(cards)
    else:
        listing = '<div class="blog-empty"><span class="blog-empty-num">01 / SOON</span><div><h3>The first Friday note is on its way.</h3><p>Until then, explore the moments that brought me here below.</p></div><span class="blog-empty-spark" aria-hidden="true">✳</span></div>'
    index = (DEST / "blog.html").read_text(encoding="utf-8")
    before, sep, rest = index.partition(START)
    middle, sep2, after = rest.partition(END)
    if not sep or not sep2:
        raise ValueError("blog.html is missing archive markers")
    (DEST / "blog.html").write_text(before + START + "\n    " + listing + "\n    " + END + after, encoding="utf-8")
    articles = DEST / "posts"
    articles.mkdir(exist_ok=True)
    for post in posts:
        (articles / (post["slug"] + ".html")).write_text(article(post), encoding="utf-8")
    print(f"Built Friday Notes: {len(posts)} post(s)")


if __name__ == "__main__":
    main()
