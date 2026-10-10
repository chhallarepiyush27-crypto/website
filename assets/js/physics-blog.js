
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

  // Giscus hosts the authenticated composer and shared reactions in this post.
  // Only accept public discussion metadata from the expected embedded origin.
  addEventListener('message', event => {
    if (event.origin !== 'https://giscus.app') return;
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame || event.source !== frame.contentWindow) return;
    const metadata = event.data?.giscus?.discussion;
    if (!metadata) return;
    const count = metadata.totalReactionCount;
    const control = document.querySelector('[data-like-post]');
    if (control && Number.isInteger(count) && count >= 0) control.textContent = '♡ Like · ' + count;
  });
})();
