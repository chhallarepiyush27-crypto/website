import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
function card(path) { return `<article data-reader-card><div data-reader-conversation data-post-path="${path}" data-supabase-url="https://example.supabase.co" data-supabase-key="sb_publishable_test">
<span data-like-total>0</span><span data-comment-total>0</span>
<button data-like-post disabled><span data-like-label>♡ Like</span></button><button data-toggle-comments aria-expanded="false">Comment</button>
<div data-comment-panel hidden><form><input name="author" required><textarea name="comment" required></textarea><button type="submit" disabled>Post comment</button></form><div data-comments-list></div><button data-more-comments hidden>Older</button></div>
<p data-conversation-status></p><button data-refresh-conversation>Refresh</button></div></article>`; }
const dom=new JSDOM(card('/posts/a.html')+card('/posts/b.html'),{url:'https://chhallarepiyush27.com/blog.html',runScripts:'outside-only'});
const {window}=dom; const states=new Map(); let clients=0,sessions=0,session=false;
window.fakeSDK={createClient:()=>{clients++;return {
 auth:{getSession:async()=>({data:{session:session?{}:null}}),signInAnonymously:async()=>{sessions++;session=true;return {data:{}};}},
 rpc:async(name,args)=>{
  const state=states.get(args.p_post_path)||{comments:[],like_count:0,liked:false,comment_count:0,next_cursor:null};
  if(name==='blog_set_like'){state.liked=args.p_liked;state.like_count=args.p_liked?1:0;}
  if(name==='blog_add_comment'){state.comments=[{id:1,author_name:args.p_author_name,body:args.p_body,created_at:'2026-10-12T12:00:00Z'}];state.comment_count=1;}
  states.set(args.p_post_path,state);return {data:state};
 }
};}};
window.crypto.randomUUID=()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const source=(await readFile('../assets/js/reader-conversations.js','utf8')).replace("import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm')",'Promise.resolve(window.fakeSDK)');
window.eval(source);const tick=()=>new Promise(r=>setTimeout(r,10)); await tick();
const [a,b]=window.document.querySelectorAll('[data-reader-conversation]');
assert.equal(clients,1);assert.equal(sessions,0);
assert.equal(a.querySelector('[data-comment-panel]').hidden,true);
a.querySelector('[data-toggle-comments]').click();
assert.equal(a.querySelector('[data-comment-panel]').hidden,false);
assert.equal(b.querySelector('[data-comment-panel]').hidden,true);
assert.equal(window.document.activeElement,a.querySelector('textarea'));
assert.equal(a.querySelector('[data-toggle-comments]').getAttribute('aria-expanded'),'true');
a.querySelector('[data-like-post]').click();await tick();
assert.equal(a.querySelector('[data-like-total]').textContent,'1');assert.equal(b.querySelector('[data-like-total]').textContent,'0');
const form=a.querySelector('form');form.elements.author.value='Reader';form.elements.comment.value='Only article A';
form.dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();
assert.equal(a.querySelector('[data-comment-total]').textContent,'1');assert.equal(b.querySelector('[data-comment-total]').textContent,'0');
assert.equal(a.querySelector('[data-comments-list] p').textContent,'Only article A');assert.equal(b.querySelector('[data-comments-list] p'),null);
b.querySelector('[data-like-post]').click();await tick();assert.equal(sessions,1,'cards share one guest identity');
assert.equal(window.location.href,'https://chhallarepiyush27.com/blog.html','all card actions stay on archive');
a.querySelector('[data-toggle-comments]').click();assert.equal(a.querySelector('[data-comment-panel]').hidden,true);
console.log('PASS: independent cards, counts and comments, inline open/close/focus, shared guest session, no archive navigation');window.close();
