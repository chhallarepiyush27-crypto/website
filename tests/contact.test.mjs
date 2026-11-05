import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source = await readFile(new URL('../assets/js/contact.js', import.meta.url), 'utf8');
function setup(fetch, valid = true) {
  const status = {textContent: ''};
  const button = {textContent: 'Send message ↗', disabled: false};
  const form = {
    action: 'https://formspree.io/f/maqdobdv', draft: 'Keep this message', resets: 0,
    reportValidity: () => valid, querySelector: () => button,
    setAttribute() {}, removeAttribute() {},
    reset() {this.draft = ''; this.resets++;},
    addEventListener(type, handler) {this.submit = () => handler({preventDefault() {}});}
  };
  class FormData {constructor(element) {this.draft = element.draft;}}
  runInNewContext(source, {
    window: {fetch, AbortController}, fetch, AbortController, FormData,
    document: {querySelector: selector => selector === '.contact-form' ? form : status},
    setTimeout, clearTimeout
  });
  return {form, button, status};
}
test('only confirmed acceptance clears the draft; duplicate submits are blocked', async () => {
  let complete, calls = 0;
  const state = setup((url, options) => {
    calls++;
    assert.equal(url, 'https://formspree.io/f/maqdobdv');
    assert.equal(options.headers.Accept, 'application/json');
    assert.equal(options.body.draft, 'Keep this message');
    return new Promise(resolve => {complete = resolve;});
  });
  const pending = state.form.submit();
  assert.equal(state.button.disabled, true);
  await state.form.submit(); assert.equal(calls, 1);
  complete({ok: true, json: async () => ({ok: true})}); await pending;
  assert.equal(state.form.resets, 1);
  assert.equal(state.button.disabled, false);
  assert.match(state.status.textContent, /submitted/);
  assert.doesNotMatch(state.status.textContent, /delivered/);
});
test('provider failure preserves the draft and displays errors safely as text', async () => {
  const state = setup(async () => ({ok: false, json: async () => ({errors: [{message: '<b>Form unavailable</b>'}]})}));
  await state.form.submit();
  assert.equal(state.form.draft, 'Keep this message');
  assert.match(state.status.textContent, /<b>Form unavailable<\/b>/);
  assert.equal(state.button.disabled, false);
});
test('unparseable response, unconfirmed success, and network failure preserve drafts', async () => {
  for (const fetch of [
    async () => ({ok: true, json: async () => {throw new Error('HTML');}}),
    async () => ({ok: true, json: async () => ({})}),
    async () => {throw new Error('offline');}
  ]) {
    const state = setup(fetch); await state.form.submit();
    assert.equal(state.form.draft, 'Keep this message');
    assert.equal(state.form.resets, 0);
    assert.equal(state.button.disabled, false);
    assert.match(state.status.textContent, /confirm/);
  }
});
test('invalid forms never make a request', async () => {
  const state = setup(() => {throw new Error('Unexpected request');}, false);
  await state.form.submit(); assert.equal(state.form.resets, 0);
});
test('blog templates contain no reader controls, integration, or share dialog', async () => {
  for (const file of ['../blog.html', '../_layouts/post.html']) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /data-(reader-conversation|share|like-post|toggle-comments)|reader-conversations\.js|post-share-dialog|id="comments"/);
    assert.match(html, /Read the note|Back to the blog/);
  }
});
