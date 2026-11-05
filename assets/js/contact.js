(() => {
  'use strict';
  const form = document.querySelector('.contact-form');
  const status = document.querySelector('#contact-status');
  if (!form || !status || !window.fetch || !window.AbortController) return;
  const button = form.querySelector('[type="submit"]');
  const label = button.textContent;
  let submitting = false;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    submitting = true;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Submitting your message…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {Accept: 'application/json'},
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        const details = Array.isArray(result?.errors)
          ? result.errors.map(error => error.message).filter(message => typeof message === 'string').join(' ')
          : '';
        status.textContent = 'The form could not confirm your submission. ' +
          (details ? details + ' ' : '') +
          'Your message is still here. You can email me directly using the link beside the form.';
        return;
      }
      status.textContent = 'Thank you! Your message was submitted. If you don’t hear back, please email me directly.';
      form.reset();
    } catch (_) {
      status.textContent = 'We couldn’t confirm whether your message was submitted. Your message is still here. Please email me directly if needed; retrying may send a duplicate.';
    } finally {
      clearTimeout(timeout);
      submitting = false;
      button.disabled = false;
      button.textContent = label;
      form.removeAttribute('aria-busy');
    }
  });
})();
