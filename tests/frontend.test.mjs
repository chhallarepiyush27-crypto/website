import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dom = new JSDOM(`<link rel="canonical" href="https://chhallarepiyush27.com/posts/example.html">
<button data-like-post disabled><span data-like-label>♡ Like</span><span data-like-total>0</span></button>
<section data-reader-conversation data-supabase-url="https://example.supabase.co" data-supabase-key="sb_publishable_test">
<form><input name="author" required><textarea name="comment" required></textarea><button type="submit" disabled>Post comment</button></form>
<div data-conversation-status></div><div data-comments-list></div><button data-refresh-conversation>Refresh</button><button data-more-comments hidden>Older</button><span data-comment-total></span></section>`,
{url:'https://chhallarepiyush27.com/posts/example.html',runScripts:'outside-only'});
const {window}=dom;
let session=false, calls=0, likes=0, liked=false, comments=[], failNext=false;
window.fakeSDK={createClient:()=>({
  auth:{getSession:async()=>({data:{session:session ? {} : null}}),signInAnonymously:async()=>{session=true;calls++;return {data:{session:{}}};}},
  rpc:async(name,args)=>{
    if(failNext){failNext=false;return {error:{message:'Network error'}};}
    if(name==='blog_set_like'){liked=args.p_liked;likes=liked?1:0;}
    if(name==='blog_add_comment') comments=[{id:1,author_name:args.p_author_name,body:args.p_body,created_at:'2026-10-12T12:00:00Z'}];
    return {data:{comments,like_count:likes,liked,comment_count:comments.length,next_cursor:null}};
  }
})};
window.crypto.randomUUID=()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const source=(await readFile('../assets/js/reader-conversations.js','utf8'))
  .replace("import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm')",'Promise.resolve(window.fakeSDK)');
window.eval(source);
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
await tick();
const like=window.document.querySelector('[data-like-post]');
assert.equal(like.disabled,false); assert.equal(calls,0,'reading must not create guest accounts');
like.click(); await tick();
assert.equal(like.getAttribute('aria-pressed'),'true'); assert.equal(window.document.querySelector('[data-like-total]').textContent,'1');
like.click(); await tick(); assert.equal(like.getAttribute('aria-pressed'),'false'); assert.equal(calls,1);
const form=window.document.querySelector('form');
form.elements.author.value='Reader'; form.elements.comment.value='<img src=x onerror=alert(1)>';
failNext=true; form.dispatchEvent(new window.Event('submit',{cancelable:true})); await tick();
assert.equal(form.elements.comment.value,'<img src=x onerror=alert(1)>','failed submission must preserve the draft');
form.dispatchEvent(new window.Event('submit',{cancelable:true})); await tick();
assert.equal(form.elements.comment.value,'');
assert.equal(window.document.querySelector('[data-comments-list] p').textContent,'<img src=x onerror=alert(1)>');
assert.equal(window.document.querySelector('[data-comments-list] img'),null,'comments must render as text, never HTML');
assert.equal(window.location.href,'https://chhallarepiyush27.com/posts/example.html','no login redirects');
assert.equal(window.document.querySelector('[data-comment-total]').textContent,'1');
console.log('PASS: on-page like/unlike, guest created only on interaction, draft preserved on failure, comment displayed as safe text, no redirect');
window.close();
