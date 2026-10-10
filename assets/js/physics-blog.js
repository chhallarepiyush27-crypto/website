
(() => {
  'use strict';
  const article = document.querySelector('.blog-article-body');
  const bar = document.querySelector('.read-progress');
  function progress() {
    if (!article || !bar) return;
    const rect = article.getBoundingClientRect();
    const distance = Math.max(1, article.offsetHeight - window.innerHeight);
    bar.style.width = Math.min(100, Math.max(0, -rect.top / distance * 100)) + '%';
  }
  addEventListener('scroll', progress, {passive:true});
  addEventListener('resize', progress);
  progress();
  const share = document.querySelector('[data-share]');
  const copy = document.querySelector('[data-copy-link]');
  const status = document.querySelector('.share-status');
  const url = document.querySelector('link[rel=canonical]')?.href || location.href.split('#')[0];
  const title = document.querySelector('h1')?.textContent || document.title;
  if (share) {
    if (!navigator.share) share.hidden = true;
    share.addEventListener('click', async () => {
      try { await navigator.share({title, url}); }
      catch (error) { if (error.name !== 'AbortError') status.textContent = 'Use Copy link or one of the share links below.'; }
    });
  }
  if (copy) copy.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
      else {
        const field = document.createElement('textarea'); field.value = url;
        field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field);
        field.select(); const ok = document.execCommand('copy'); field.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      status.textContent = 'Link copied.';
    } catch (_) { status.textContent = 'Copy this link: ' + url; }
  });
  document.querySelectorAll('[data-share-service]').forEach(link => {
    const service = link.dataset.shareService;
    const u = encodeURIComponent(url), t = encodeURIComponent(title);
    link.href = service === 'linkedin' ? 'https://www.linkedin.com/sharing/share-offsite/?url=' + u
      : service === 'whatsapp' ? 'https://wa.me/?text=' + t + '%20' + u
      : 'mailto:?subject=' + t + '&body=' + u;
  });
  const discussion = document.querySelector('[data-reader-thread]');
  if (!discussion) return;
  const base = 'https://api.github.com/repos/chhallarepiyush27-crypto/website/issues/' + discussion.dataset.readerThread;
  const list = discussion.querySelector('.reader-comments');
  const notice = discussion.querySelector('.comment-status');
  const refresh = discussion.querySelector('[data-refresh-comments]');
  async function request(endpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, {signal:controller.signal, headers:{Accept:'application/vnd.github+json'}});
      if (!response.ok) throw new Error('Comments unavailable');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function load() {
    if (refresh.disabled) return;
    refresh.disabled = true; notice.textContent = 'Loading reader conversation…';
    try {
      const [issue, comments] = await Promise.all([request(base), request(base + '/comments?per_page=100')]);
      const likes = (issue.reactions?.['+1'] || 0) + (issue.reactions?.heart || 0);
      discussion.querySelector('[data-reaction-count]').textContent = '♡ Like / react · ' + likes;
      list.replaceChildren();
      comments.forEach(comment => {
        const card = document.createElement('article'); card.className = 'reader-comment';
        const header = document.createElement('header');
        const author = document.createElement('a'); author.textContent = '@' + comment.user.login;
        author.href = comment.html_url; author.target = '_blank'; author.rel = 'noopener noreferrer';
        const time = document.createElement('time'); time.dateTime = comment.created_at;
        time.textContent = new Date(comment.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
        const body = document.createElement('p'); body.textContent = comment.body || '';
        header.append(author,time); card.append(header,body); list.append(card);
      });
      notice.textContent = issue.comments ? issue.comments + ' reader comment' + (issue.comments === 1 ? '' : 's') + (issue.comments > comments.length ? ' · Latest comments are available on GitHub.' : '') : 'No comments yet. Be the first to share a thought.';
    } catch (_) { notice.textContent = 'The conversation is available on GitHub. Open the thread below to read, comment, or react.'; }
    finally { refresh.disabled = false; }
  }
  refresh.addEventListener('click',load);
  addEventListener('focus', load);
  load();
})();
