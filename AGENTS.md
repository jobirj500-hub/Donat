# Architecture rules
- Keep this Telegram Mini App on its existing Railway Express/SQLite runtime; it owns live bot data.
- Keep visual tokens in public/app.css and line icons in public/icons.js, so all screens share one presentation.
- Checkout drafts are per-user, expire after one hour, and carry explicit purchase consent plus an immutable request key and price ceiling.
- Keep all Telegram authentication, blocking, store availability, balance checks, and refund safeguards; optional player lookup is not an authorization gate.
- Deduplicate checkout requests in the SQLite transaction before debit and provider submission, so network retries do not charge twice.
- Route bot text through message-text.js so saved admin text and keyboard labels are normalized without changing URLs.
