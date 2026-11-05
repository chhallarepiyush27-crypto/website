# Publishing Friday Notes

Create `_posts/YYYY-MM-DD-title.md` with title, category, date, and excerpt. Every post uses the shared article layout. The blog listing and articles have no commenting, liking, or sharing controls.

The previous Supabase reader integration is disconnected from the website. Its migration and earlier tests are retained as historical source; no existing reader data is deleted.

## Contact form

The contact form posts to the existing Formspree form `maqdobdv`. The browser displays acceptance or failure, preserves drafts on failure, and includes a direct email fallback. Acceptance by Formspree does not prove inbox delivery.

To finish investigating missing email, sign in to the form owner's Formspree dashboard. Confirm this form belongs to the owner, inspect its submissions and spam, and check its target email and email notification workflow. Verify the intended recipient address, then submit one clearly labeled test and confirm it arrives. If accepted submissions do not arrive, check recipient spam and mail quarantine and Formspree's delivery troubleshooting. No provider recipient settings were changed in this update.

## Verification

Run `node --test tests/contact.test.mjs`. This uses mocked requests and sends no email. Check the Projects page, contact form, blog listing, and a full article on desktop and mobile after deployment.
