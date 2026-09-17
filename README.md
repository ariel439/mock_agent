# T-Code · Soft Rock Coffee

A standalone, offline VS Code presentation extension using Enterprise Agent's compact chat layout, neutral dark colors, and subtle magenta accents. The demo workspace is **Soft Rock Coffee**, a café website with cream, espresso-brown, and terracotta styling and seven local photos. Enterprise Agent itself is unchanged.

This is a scripted demo with no LLM, provider settings, API keys, backend, telemetry, or runtime network calls. The first nonempty prompt always applies TCODE-101; the second applies TCODE-102. Prompts appear in chat but do not determine the edits. Further prompts are blocked until reset. The sidebar is simply an empty chat and composer, with no ticket cards, counters, preview controls, or scripted-demo labels.

## Present

1. Install `artifacts/t-code-0.2.0.vsix` using **Extensions: Install from VSIX…** in VS Code. Build it using the commands below if you cloned the repository.
2. Open `demo-project` in a trusted VS Code window. Opening its parent folder also works. Keep the entire `images` directory with the project.
3. Open `demo-project/index.html` directly in your browser. No server or dependency installation is needed to run the page. It starts with the café hero, story, and a menu placeholder.
4. Click **T** in the VS Code activity bar. Paste [TCODE-101](tickets/TCODE-101.md) into the chat and send. Refresh the browser with **F5**: six drink cards appear with photos, descriptions, prices, and temperature labels.
5. Paste [TCODE-102](tickets/TCODE-102.md) and send. Refresh the browser again: filters, Add to order buttons, and an order summary appear.
6. Select **Iced** and add Cold Brew. Select **Hot** and add Espresso twice: the total is **$10.75**. Change quantities, remove a drink, or clear the order. Filters preserve order contents; browser refresh clears the order.

Enter sends; Shift+Enter adds a newline. Click a changed filename or **View diff** to inspect edits. The brief progress messages are scripted pacing, not model reasoning or test execution. Changes apply automatically to the marked demo project. The optional **T-Code: Preview Demo Page** command opens an automatically refreshed preview inside VS Code.

Prices are illustrative USD amounts. Ordering is local and in memory only, with no checkout, payment, or backend. Quantities are limited to 99 per drink. Photos are illustrative stock images from Pexels; see [photo sources and license link](demo-project/images/CREDITS.md). They are bundled locally, not downloaded while presenting.

## Reset and move to another PC

Run **T-Code: Reset Demo** from the Command Palette and confirm, or run this from the repository root:

```powershell
npm run reset
```

Refresh the browser afterward. Reset restores `index.html`, `styles.css`, `app.js`, and the stage marker. Photos and other files are preserved. Saved edits to those three files are intentionally discarded. Run the script while the extension is idle and demo editors have no unsaved changes. The extension notices the stage reset and clears the chat.

For another PC, reset first, then transfer the VSIX and the **whole** `demo-project` folder, including `.t-code-demo.json` and `images/`. Install the VSIX, open the project, and present. Include `tickets/` for the prompts and the repository's scripts if you want terminal reset; the installed extension always provides the Command Palette reset.

When upgrading from the older Service Hub demo, install version 0.2.0 and use this updated demo folder. Reset accepts the old marker and replaces the page with Soft Rock Coffee, but does not download missing photos. Use the supplied `images/` directory.

The extension refuses unrelated workspaces, ambiguous multi-root demos, and dirty demo editors. Applying a ticket stops if a page file has manual edits. Stage lives in `demo-project/.t-code-demo.json`; chat lives in VS Code workspace state.

## Develop, verify, and package

Use Node.js 22 or newer. Development dependency installation and initial test-tool downloads need internet. The installed extension and page do not.

```powershell
npm install
npm run check
npx playwright install chromium
npm run test:ui
npm run test:integration
npm run package
```

Packaging creates `artifacts/t-code-0.2.0.vsix`. It contains the extension, chat UI, page templates, scenario logic, and ticket text. The editable demo workspace and photos are intentionally separate from the VSIX. No runtime npm dependencies or compilation are needed. Open the repository in VS Code and press F5 for the development configuration; browser F5 refreshes the website instead.

`test:integration` launches a real isolated Extension Host with a temporary demo and local photos. Set `TCODE_VSCODE_EXECUTABLE` to an existing VS Code executable to avoid downloading VS Code. `test:ui` runs Chromium against a temporary `file://` page, verifies photo loading without HTTP requests, and saves screenshots in `test-results/`.

Tests cover both tickets, reset/replay and old-marker migration, preserving images, edit guards, real Extension Host edits/diffs/preview activation, responsive layout, temperature filters, duplicate additions, quantity bounds, exact totals, removal, clearing, refresh behavior, keyboard focus, and the chat bridge. Browser tests do not automate VS Code sidebar rendering or native reset confirmation.

Source: [extension host](src/extension.js), [file operations](src/demo.js), [page scenarios](src/scenario.js), [order logic](src/order.js), [chat](media/chat.html), [core tests](tests/core.test.js), [order tests](tests/order.test.js), [host tests](tests/host.js), [browser tests](tests/ui.js).
