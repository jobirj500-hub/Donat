# Architecture rules
- Keep this Telegram Mini App on its existing Railway Express/SQLite runtime; it owns live bot data.
- Keep visual tokens in public/app.css and line icons in public/icons.js, so all screens share one presentation.
- Checkout drafts are per-user, expire after one hour, and carry explicit purchase consent plus an immutable request key and price ceiling.
- Keep all Telegram authentication, blocking, store availability, balance checks, and refund safeguards; optional player lookup is not an authorization gate.
- Deduplicate checkout requests in the SQLite transaction before debit and provider submission, so network retries do not charge twice.
- Route bot text through message-text.js so saved admin text and keyboard labels are normalized without changing URLs.
- Mini App UI text is written in Uzbek; public/i18n.js swaps it to Russian by exact phrase/pattern lookup and never touches API content (game, package, user names) or the admin panel.
- Package pictures and names are shown exactly as Donat24 provides them; never restyle, recolor or replace them with decorative art.
- Order ratings live in src/ratings.js: one 1–5 rating per delivered order, only by its owner.
