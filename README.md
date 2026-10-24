# D-oul Studio

Paste HTML, get a data URL or a named bookmarklet. UTF-8 safe, size-metered.

## Use
- Open index.html, or drag the purple button to your bookmarks bar.
- Paste HTML -> Convert / Make Bookmark / Download.
- Bookmarklet opens the page in a new tab via blob URL (no document.write, no 2MB cap).
- Same-tab mode rewrites documentElement.innerHTML.

## Limits
- Bookmark URL: ~64KB (Chrome). UI meters it and refuses to emit oversized.
- data: navigation: ~2MB (Chrome). UI warns.
- Pasted scripts run in the target page's origin when the bookmarklet fires. Only use HTML you trust.
