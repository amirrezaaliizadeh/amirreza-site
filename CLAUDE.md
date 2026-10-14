# Site workflow (amirrezaalizadeh.com)

- GitHub `amirrezaaliizadeh/amirreza-site`, branch `main`, is the ONLY source of truth. Cloudflare Workers Builds deploys every push.
- Never deploy with `wrangler deploy` from a local folder: it gets overwritten by the next push and changes silently disappear.
- Before editing, always `git pull`/fetch and compare with the live site; after editing, commit and push to `main`, then check the live page.
- A local copy exists at ~/Desktop/Amir/claude/site (no remote). Treat it as stale; re-sync from GitHub instead of editing it.
- Standing site rules: no photos on the page; no Wikipedia links; five-plus languages (en, fa, it, fr, es, de, ar) with RTL for fa/ar.
