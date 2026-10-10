
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

  const dialog = document.querySelector('#post-share-dialog');
  const canonical = document.querySelector('link[rel=canonical]')?.href || location.href.split('#')[0];
  let shared = {url:canonical, title:document.querySelector('h1')?.textContent || document.title};
  const status = () => dialog?.open ? dialog.querySelector('.share-status') : document.querySelector('.share-status');
  function shareLinks() {
    const u = encodeURIComponent(shared.url), t = encodeURIComponent(shared.title);
    const links = {
      linkedin:'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
      whatsapp:'https://wa.me/?text=' + t + '%20' + u,
      telegram:'https://t.me/share/url?url=' + u + '&text=' + t,
      facebook:'https://www.facebook.com/sharer/sharer.php?u=' + u,
      x:'https://twitter.com/intent/tweet?url=' + u + '&text=' + t,
      reddit:'https://www.reddit.com/submit?url=' + u + '&title=' + t,
      email:'mailto:?subject=' + t + '&body=' + u
    };
    dialog.querySelectorAll('[data-share-service]').forEach(link => link.href = links[link.dataset.shareService]);
    dialog.querySelector('.share-post-title').textContent = shared.title;
    dialog.querySelector('.share-status').textContent = '';
    dialog.querySelector('[data-native-share]').hidden = !navigator.share;
  }
  function openOptions() { if (dialog) { shareLinks(); dialog.showModal(); } }
  async function nativeShare() {
    if (!navigator.share) { openOptions(); return; }
    try { await navigator.share(shared); }
    catch (error) { if (error.name !== 'AbortError') openOptions(); }
  }
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', () => {
    shared = {url:button.dataset.postUrl ? new URL(button.dataset.postUrl, location.origin).href : canonical,
      title:button.dataset.postTitle || document.querySelector('h1')?.textContent || document.title};
    // The chooser always offers both app links and the device's full native sheet.
    openOptions();
  }));
  dialog?.querySelector('[data-native-share]').addEventListener('click', nativeShare);
  dialog?.querySelector('[data-close-share]').addEventListener('click', () => dialog.close());
  document.querySelectorAll('[data-copy-link]').forEach(copy => copy.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(shared.url);
      else {
        const field = document.createElement('textarea'); field.value = shared.url;
        field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field);
        field.select(); const ok = document.execCommand('copy'); field.remove();
        if (!ok) throw new Error('Copy unavailable');
      }
      status().textContent = 'Link copied. Paste it into any app.';
    } catch (_) { status().textContent = 'Copy this link: ' + shared.url; }
  }));
  const discussion = document.querySelector('[data-reader-thread]');
  if (!discussion) return;
  let thread = discussion.dataset.readerThread;
  const postUrl = discussion.dataset.postUrl || canonical;
  const repositoryAPI = 'https://api.github.com/repos/chhallarepiyush27-crypto/website';
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
      if (!thread) {
        const q = 'repo:chhallarepiyush27-crypto/website is:issue in:body "' + postUrl + '"';
        const result = await request('https://api.github.com/search/issues?q=' + encodeURIComponent(q));
        const match = result.items.find(issue => !issue.pull_request && issue.body?.includes('(' + postUrl + ')'));
        if (!match) { notice.textContent = 'This post’s conversation is being prepared. Refresh in a moment.'; return; }
        thread = match.number;
      }
      const base = repositoryAPI + '/issues/' + thread;
      const threadUrl = 'https://github.com/chhallarepiyush27-crypto/website/issues/' + thread;
      discussion.querySelector('[data-comment-link]').href = threadUrl + '#new_comment_field';
      discussion.querySelector('[data-reaction-count]').href = threadUrl;
      discussion.querySelector('[data-thread-link]').href = threadUrl;
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
