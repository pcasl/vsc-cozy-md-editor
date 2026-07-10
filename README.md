# Cozy Markdown Editor

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=dudgeon.cozy-md-editor">
    <img src="docs/cozy-md-editor-fleece.png" width="200" alt="Cozy MD Editor logo — a fleece blanket with a markdown hash symbol" />
  </a>
  <br/>
  <a href="https://marketplace.visualstudio.com/items?itemName=dudgeon.cozy-md-editor">
    <img src="https://img.shields.io/visual-studio-marketplace/v/dudgeon.cozy-md-editor?label=VS%20Code%20Marketplace&color=blue" alt="VS Code Marketplace" />
  </a>
</p>

A VS Code extension that makes markdown easier, with critic support and a cozy reading experience. More importantly, it makes the useage of AI tools like ChatGPT and Claude Code more comfortable by providing a better reading experience for markdown files.

**Author / maintainer:** Li Zhao. This is a fork of the original Cozy Markdown Editor project by the original author/publisher, `dudgeon`.

## What it does

**Hides the syntax, shows the formatting.** Markdown uses symbols like `**` for bold and `#` for headings. Cozy MD Editor hides those symbols and shows you what the formatting actually looks like — sized headings, bold text, underlined links. If you need to edit the raw syntax, move your cursor to it and the symbols reappear.

**Keyboard shortcuts that match Google Docs.** Cmd+B bolds, Cmd+I italicizes, Cmd+K inserts a link. If you've used a word processor before, the shortcuts work the way you'd expect.

**Lists and tables behave normally.** Hit Enter at the end of a bullet point and you get a new bullet. Tab indents. Tables have a toolbar for adding rows and columns, and Tab moves between cells. Tables auto-align when you save.

**Track changes.** The extension reads and renders [CriticMarkup](https://criticmarkup.com) — a format for marking additions, deletions, and substitutions right in the file. Changes show up color-coded — green for additions, red strikethrough for deletions — and you can accept or reject them individually. Move your cursor to a change to see the full syntax and Accept/Reject controls. Track changes *recording* is built in — toggle it on and your edits are automatically wrapped in CriticMarkup.

## Typography

The extension ships with two typography bundles:

- **Reader** (default) — Newsreader for headings, Plus Jakarta Sans for body text. Warm and literary, good for long-form writing and drafts.
- **Clean** — Inter for everything. Information-dense and familiar (same font as Notion, Linear, GitHub). Good for notes, research, and structured docs.

Switch between them in Settings (`Cmd+,`) — search for "typography bundle".

**Making your own bundle:** You can define custom bundles in your settings.json. For example, to create a monospace bundle:

```json
"cozyMd.typography.customBundles": {
    "monospace": {
        "bodyFont": "'JetBrains Mono', monospace",
        "headingFont": "'JetBrains Mono', monospace",
        "bodySize": 14,
        "bodyLineHeight": 1.5
    }
},
"cozyMd.typography.activeBundle": "monospace"
```

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=dudgeon.cozy-md-editor) or download the `.vsix` from the releases page

## Keyboard shortcuts

| Action               | Mac          | Windows / Linux |
| -------------------- | ------------ | --------------- |
| Bold                 | Cmd+B        | Ctrl+B          |
| Italic               | Cmd+I        | Ctrl+I          |
| Inline code          | Cmd+`        | Ctrl+`          |
| Link                 | Cmd+K        | Ctrl+K          |
| Cycle heading level  | Cmd+Shift+H  | Ctrl+Shift+H    |
| Insert frontmatter   | Cmd+Option+F | Ctrl+Alt+F      |
| Table menu           | Cmd+Shift+T  | Ctrl+Alt+T      |
| Indent lines         | Cmd+]        | Ctrl+]          |
| Outdent lines        | Cmd+[        | Ctrl+[          |
| Toggle track changes | Cmd+Option+T | Ctrl+Shift+T    |
| Add comment          | Cmd+Option+M | Ctrl+Alt+M      |
| Accept change        | Cmd+Option+= | Ctrl+Alt+A      |
| Reject change        | Cmd+Option+- | Ctrl+Alt+R      |
| Next change          | Cmd+Option+] | Ctrl+Alt+]      |
| Previous change      | Cmd+Option+[ | Ctrl+Alt+[      |

## Switching between Cozy, Clean, and standard editing

**Cozy mode:** Decorated markdown with formatting polish and full CriticMarkup rendering.

**Clean mode:** Additions still render inline, while comments and deleted text collapse to compact icons.

**Raw markdown mode:** Click the mode button in the toolbar to cycle **Cozy → Clean → MD**. In **MD** mode, decorations are disabled and you see the raw markdown.

**Reverting to VS Code defaults:** If you want to go back to VS Code's standard markdown editing (no Cozy MD decorations or font changes), disable the extension in the Extensions panel (`Cmd+Shift+X`), find "Cozy Markdown Editor", and click **Disable**. Your editor settings will revert to their previous values.

## Feedback and feature requests

This is under active development. If something doesn't work, feels weird, or you wish it did something it doesn't — open an issue:

**[github.com/pcasl/vsc-cozy-md-editor/issues](https://github.com/pcasl/vsc-cozy-md-editor/issues)**

You don't need to be technical. Just describe what happened or what you want, and a screenshot if you have one.

## License

MIT
