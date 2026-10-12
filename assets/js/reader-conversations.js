// Only the public Supabase publishable (or legacy anon) key belongs in HTML.
(() => {
  'use strict';
  const clients = new Map(), sessions = new Map();
  document.querySelectorAll('[data-reader-conversation]').forEach(init);
  function init(region) {
  const form = region.querySelector('form');
  const notice = region.querySelector('[data-conversation-status]');
  const list = region.querySelector('[data-comments-list]');
  const scope = region.closest('[data-reader-card]') || region;
  const extra = region.dataset.readerContext === 'article' ? [...document.querySelectorAll('.post-actions [data-like-post]')] : [];
  const likeButtons = [...scope.querySelectorAll('[data-like-post]'), ...extra];
  const refresh = region.querySelector('[data-refresh-conversation]');
  const more = region.querySelector('[data-more-comments]');
  const submit = form?.querySelector('button[type="submit"]');
  const path = region.dataset.postPath || new URL(document.querySelector('link[rel="canonical"]').href).pathname;
  const url = region.dataset.supabaseUrl;
  const key = region.dataset.supabaseKey;
  if (!url || !key) return;
  let nextCursor = null, liked = false, busyLike = false;
  let pendingComment = null, publishing = false, loading = false;
  const seen = new Set();
  const message = text => { notice.textContent = text; };
  function publicKey(value) {
    if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) return true;
    try {
      const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.role === 'anon';
    } catch (_) { return false; }
  }
  async function connect() {
    if (!clients.has(url)) clients.set(url, (async () => {
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || !publicKey(key)) {
        throw new Error('Reader conversations are not configured yet.');
      }
      const {createClient} = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
      return createClient(url, key, {
        auth: {persistSession:true, autoRefreshToken:true, detectSessionInUrl:false},
        global: {fetch: async (input, init = {}) => {
          const controller = new AbortController();
          const abort = () => controller.abort();
          if (init.signal?.aborted) abort();
          else init.signal?.addEventListener('abort', abort, {once:true});
          const timer = setTimeout(abort, 12000);
          try { return await fetch(input, {...init, signal:controller.signal}); }
          finally { clearTimeout(timer); init.signal?.removeEventListener('abort', abort); }
        }}
      });
    })().catch(error => { clients.delete(url); throw error; }));
    return clients.get(url);
  }
  async function guest() {
    if (!sessions.has(url)) sessions.set(url, (async () => {
      const client = await connect();
      const {data, error} = await client.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        const result = await client.auth.signInAnonymously();
        if (result.error) throw result.error;
      }
      return client;
    })().finally(() => { sessions.delete(url); }));
    return sessions.get(url);
  }
  async function rpc(name, params, write = false) {
    const client = await (write ? guest() : connect());
    const {data, error} = await client.rpc(name, params);
    if (error) throw error;
    return data;
  }
  function totals(data) {
    liked = data.liked === true;
    [...scope.querySelectorAll('[data-like-total]'), ...extra.flatMap(button => [...button.querySelectorAll('[data-like-total]')])].forEach(el => { el.textContent = data.like_count; });
    scope.querySelectorAll('[data-comment-total]').forEach(el => { el.textContent = data.comment_count; });
    likeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(liked));
      button.querySelector('[data-like-label]').textContent = liked ? '♥ Liked' : '♡ Like';
    });
  }
  function render(data, append = false) {
    totals(data);
    if (!append) { list.replaceChildren(); seen.clear(); }
    data.comments.forEach(comment => {
      if (seen.has(comment.id)) return;
      seen.add(comment.id);
      const card = document.createElement('article'); card.className = 'reader-comment';
      const head = document.createElement('header');
      const author = document.createElement('strong'); author.textContent = comment.author_name;
      const time = document.createElement('time'); time.dateTime = comment.created_at;
      time.textContent = new Date(comment.created_at).toLocaleDateString(undefined, {month:'short',day:'numeric',year:'numeric'});
      const body = document.createElement('p'); body.textContent = comment.body;
      head.append(author,time); card.append(head,body); list.append(card);
    });
    nextCursor = data.next_cursor; more.hidden = nextCursor === null;
  }
  function errorText(error) {
    const text = error?.message || '';
    if (text.includes('15 seconds') || text.includes('Daily comment limit')) return text;
    if (text.includes('anonymous_provider_disabled')) return 'Comments and likes are being connected. Please check back soon.';
    return 'Could not connect just now. Please try again. Your comment is still in the form.';
  }
  async function load(append = false) {
    if (loading || publishing) return;
    loading = true;
    refresh.disabled = true; more.disabled = true;
    try {
      const data = await rpc('blog_conversation', {p_post_path:path, p_before:append ? nextCursor : null});
      render(data, append);
      message(data.comment_count ? 'Join the conversation below.' : 'No comments yet. Be the first to share a thought.');
      likeButtons.forEach(button => { button.disabled = busyLike; });
      form.querySelectorAll('input, textarea, button').forEach(el => { el.disabled = false; });
    } catch (error) { message(errorText(error)); }
    finally { loading = false; refresh.disabled = false; more.disabled = false; }
  }
  likeButtons.forEach(button => button.addEventListener('click', async () => {
    if (busyLike) return;
    busyLike = true; likeButtons.forEach(el => { el.disabled = true; });
    try {
      const data = await rpc('blog_set_like', {p_post_path:path, p_liked:!liked}, true);
      totals(data); message(liked ? 'Thanks for the like!' : 'Your like was removed.');
    } catch (error) { message(errorText(error)); region.scrollIntoView({block:'start',behavior:'smooth'}); }
    finally { busyLike = false; likeButtons.forEach(el => { el.disabled = false; }); }
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (publishing || loading || submit.disabled || !form.reportValidity()) return;
    const author = form.elements.author.value.trim(), body = form.elements.comment.value.trim();
    if (!author || !body) { message('Please enter your name and a comment.'); return; }
    if (!pendingComment || pendingComment.author !== author || pendingComment.body !== body) {
      pendingComment = {author, body, id:crypto.randomUUID()};
    }
    publishing = true; submit.disabled = true; submit.textContent = 'Posting…';
    try {
      const data = await rpc('blog_add_comment', {p_post_path:path,p_author_name:author,p_body:body,p_request_id:pendingComment.id}, true);
      render(data); form.elements.comment.value = ''; pendingComment = null;
      message('Your comment is posted. Thanks for joining the conversation!');
    } catch (error) { message(errorText(error)); }
    finally { publishing = false; submit.disabled = false; submit.textContent = 'Post comment'; }
  });
  refresh.addEventListener('click', () => load());
  more.addEventListener('click', () => load(true));
  const panel = region.querySelector('[data-comment-panel]');
  const toggles = region.querySelectorAll('[data-toggle-comments]');
  toggles.forEach(button => button.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(open)));
    if (open) form.elements.comment.focus();
  }));
  if (region.dataset.readerContext === 'article') {
    const openPanel = () => {
      panel.hidden = false;
      toggles.forEach(toggle => toggle.setAttribute('aria-expanded', 'true'));
    };
    document.querySelector('.post-actions a[href="#comments"]')?.addEventListener('click', openPanel);
    if (location.hash === '#comments') openPanel();
  }
  load();
  }
})();
