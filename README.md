# SlideMotion Studio

SlideMotion Studio is an interactive presentation design studio, motion laboratory and educational trainer built with React, TypeScript, Vite, Tailwind CSS and Electron. It combines a vector slide editor, reusable asset library, boolean shape merging, Morph transitions, animation choreography, presenter mode and structured design lessons in a single local-first workspace.

## Live Web App (GitHub Pages)

Once GitHub Pages is enabled, the web application is published at:

```text
https://USERNAME.github.io/REPO-NAME/
```

Replace `USERNAME` with your GitHub username and `REPO-NAME` with your repository name.

## Install as an Offline PWA

SlideMotion Studio bundles all fonts, styles, icons and scripts locally and precaches built assets via a Service Worker, so it works offline after your first visit.

- **Desktop (Chrome, Edge, Brave):** Open the GitHub Pages URL, click the install icon in the browser address bar or the **Install** button in the studio header, and confirm installation.
- **Android (Chrome, Edge):** Open the browser menu and select **Install app** or **Add to Home screen**.
- **iPhone / iPad (Safari):** Open the **Share** menu and choose **Add to Home Screen**.

Projects automatically save locally to browser **IndexedDB**, with `.slidemotion.json` export/import and PNG, PDF and standalone HTML deck export.

## Windows Desktop Installer

Pre-built Windows (`x64`) NSIS installers (`SlideMotion-Studio-Setup-1.0.0.exe`) are available on the repository **Releases** page:

```text
https://github.com/USERNAME/REPO-NAME/releases
```

## Local Development & Packaging

```bash
npm install --no-audit --no-fund
npm run typecheck
npm run build
npm run dev
npm run electron:dev
npm run electron:build
```
