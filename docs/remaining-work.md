# Remaining work before launch

The core practice MVP is implemented. Treat “80%” as the scope target, not as a
measured completion percentage or a substitute for live testing.

1. Verify signup, confirmation, login and password reset with real email delivery.
2. Import verified historical JEE papers, metadata, diagrams and explanations.
3. Test the accepted marking schemes and numerical tolerances against each source.
4. Deploy the same-origin Express + built React app; configure HTTPS Auth redirects,
   production SMTP, secrets and appropriate hosting proxy settings.
5. Reconcile the separate coursework schema/ERD with the Supabase UUID profile and
   paper source metadata before the final submission.

Deliberately outside this MVP: AI predictions, percentile/rank claims, payment,
leaderboards, a public admin panel, OCR, automatic paper extraction, and partial-credit
multiple-select scoring. Formula rendering, image uploads and pagination beyond
100 catalogue/history rows can be added when real paper content requires them.

The current timer is server-enforced. Background browser tabs don't add active
question-reading time, but the overall attempt deadline still runs. Autosave
requires a connection; an unsaved-change warning asks the student to retry before
leaving. A forced browser/process close can lose changes that never reached the server.
