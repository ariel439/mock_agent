# T-Code

A standalone, offline VS Code presentation extension inspired by Enterprise Agent’s compact chat layout, with a magenta theme and a simple T mark. The source Enterprise Agent is unchanged.

This is a scripted demo: it has no LLM, provider settings, API keys, backend, telemetry, or runtime network calls. Prompts are displayed in chat but do not determine the edits. The first nonempty prompt always applies TCODE-101; the second applies TCODE-102. Further prompts are blocked until reset. Ticket labels and the design are presentation examples, not a Jira integration or an official brand asset.

## Present

1. Install `artifacts/t-code-0.1.1.vsix` with VS Code’s **Extensions: Install from VSIX…** command.
2. Open this folder’s `demo-project` directory in a trusted VS Code window. Opening the parent `mock` folder also works.
3. Open `demo-project/index.html` in your browser. In VS Code, click the **T** in the activity bar to open the empty chat sidebar.
4. Copy [TCODE-101](tickets/TCODE-101.md) into the chat and press Enter. Switch to the browser and press F5 to refresh: six service cards appear.
5. Copy [TCODE-102](tickets/TCODE-102.md) into the chat and send it. Refresh the browser with F5 again. Search and category filters now work. Try **Security**, then search **access**; search **xyz** to show the empty state.
6. Click a changed filename to inspect the file, or **View diff** for that ticket’s before/after snapshot. An optional built-in preview remains available through **T-Code: Preview Demo Page** in the Command Palette.

The sidebar contains only the chat and composer: no ticket cards, stage counter, preview button, or scripted-demo labels. Tickets remain in separate Markdown files. Enter sends; Shift+Enter inserts a newline. The brief progress sequence is scripted presentation pacing, not model reasoning or test execution. Changes apply automatically to the marked demo project.

## Reset

Use the chat’s reset arrow or **T-Code: Reset Demo** from the Command Palette. Confirm the reset to restore the three page files, clear the chat, and start again at ticket 1.

Or run this from the `mock` directory:

```powershell
npm run reset
```

The script needs only Node.js. It restores `demo-project/index.html`, `styles.css`, `app.js`, and the stage marker. It leaves other files alone. An open extension notices the marker change and clears its chat. Run the script while the demo is idle, with no unsaved edits in those files. Reset intentionally discards saved edits to the three demo files.

The extension refuses unrelated workspaces, ambiguous multi-root demos, and dirty demo editors. Ticket application stops if the page has manual edits. Save your work elsewhere before resetting. Stage is stored in `demo-project/.t-code-demo.json`; chat is stored in VS Code workspace state. No data leaves the machine.

## Develop and package

Use Node.js 22 or newer. Dependency installation and the initial browser/VS Code test downloads require internet; the packaged extension and page do not.

```powershell
npm install
npm run check
npx playwright install chromium
npm run test:ui
npm run test:integration
npm run package
```

Packaging creates `artifacts/t-code-0.1.1.vsix`. The VSIX contains the extension, UI, scenario definitions, and ticket text. Keep this `mock` folder alongside the VSIX: the editable `demo-project` is intentionally separate from the installed extension. Runtime has no npm dependencies and requires no compilation. Open `mock` in VS Code and press F5 to launch the included development configuration.

`test:integration` launches an isolated VS Code Extension Host against a temporary demo. Set `TCODE_VSCODE_EXECUTABLE` to an existing VS Code executable to avoid its download. `test:ui` uses headless Chromium and saves screenshots to `test-results`. Tests cover ticket order/replay, edit guards, workspace detection, real Extension Host activation/file edits/diffs/preview, page interactions and responsive layout, and chat interactions with a mocked VS Code bridge. Browser tests do not automate VS Code’s sidebar rendering or native reset confirmation.

Source: [extension host](src/extension.js), [deterministic file operations](src/demo.js), [page scenarios](src/scenario.js), [chat markup](media/chat.html), [unit tests](tests/core.test.js), [host tests](tests/host.js), [browser tests](tests/ui.js).
