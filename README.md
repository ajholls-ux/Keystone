# Keystone Field Kit

An assessor-led operational assessment platform. See `CHANGELOG.md` for
release history.

Stack: HTML, CSS, vanilla JavaScript (ES modules). No build step, no
dependencies, no backend. State persists to `localStorage` on-device.

## Testing locally

ES modules require the app to be served over HTTP — opening `index.html`
directly via `file://` will not work reliably in Safari.

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000` (or your machine's local IP, from an
iPhone on the same network).

## One-time setup: public preview via GitHub Pages

This repo is structured to publish as-is with no build step.

1. Create a new empty repository on GitHub (no README/license — this repo
   already has them).
2. From this folder:
   ```
   git remote add origin <your-repo-url>
   git push -u origin master --tags
   ```
3. On GitHub: **Settings → Pages → Source → Deploy from a branch → `master` / `root`**.
4. GitHub will publish at `https://<username>.github.io/<repo-name>/`.
   First publish takes a minute or two.

After this one-time setup, every future release is:

```
git add -A
git commit -m "vX.Y.Z — <milestone name>"
git tag vX.Y.Z
git push && git push --tags
```

The same public URL updates automatically — refresh Safari on iPhone to
see the new version.

## Testing on iPhone (once published)

Open the GitHub Pages URL directly in Safari. No local server needed.
