import * as vscode from 'vscode';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor';
import { HTMLHandler } from 'mathjax-full/js/handlers/html/HTMLHandler';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';
import {
    DecorationDisplayMode,
    DecorationManager,
    DecorationProvider,
    DecoratedRegion,
} from './manager';
import { parseMarkdownMath } from '../parsers/math';

const ID_MATH = 'markdown-math-live';
const HIDDEN_SOURCE: vscode.DecorationRenderOptions = {
    color: 'transparent',
    letterSpacing: '-1em',
};
const RAW_SOURCE: vscode.DecorationRenderOptions = {};

const adaptor = liteAdaptor();
// Construct a local handler directly. Importing MathJax's global handler
// pulls in a runtime package-version lookup that resolves from the wrong
// directory after esbuild bundles the extension into dist/extension.js.
const mathDocument = new HTMLHandler(adaptor).create('', {
    InputJax: new TeX({ packages: AllPackages }),
    OutputJax: new SVG({ fontCache: 'none' }),
});
const svgCache = new Map<string, vscode.Uri>();

class MathProvider implements DecorationProvider {
    readonly id = ID_MATH;

    provideDecorations(editor: vscode.TextEditor): DecoratedRegion[] {
        const text = editor.document.getText();
        const foreground = equationForeground();

        return parseMarkdownMath(text).flatMap(math => {
            try {
                const range = new vscode.Range(
                    editor.document.positionAt(math.start),
                    editor.document.positionAt(math.end),
                );
                const icon = renderEquation(math.expression, math.display, foreground);
                const attachment: vscode.ThemableDecorationAttachmentRenderOptions = {
                    contentIconPath: icon,
                    margin: math.display ? '0.25em 0.5em' : '0 0.12em',
                };

                return [{
                    range,
                    spanRange: range,
                    expandOnAdjacent: false,
                    collapsedDecoration: {
                        range,
                        renderOptions: {
                            // Anchor the SVG at the source start. Attaching an
                            // inline SVG after the hidden range maps a mouse
                            // click to the range end; revealing the source then
                            // inserts its width before the cursor and makes the
                            // cursor appear to jump across the line.
                            before: attachment,
                        },
                    },
                    expandedDecoration: { range },
                }];
            } catch {
                // Invalid/incomplete TeX remains editable as plain markdown.
                return [];
            }
        });
    }
}

/** Live inline equation rendering for Cozy and Clean modes. */
export class MathDecorationProvider implements vscode.Disposable {
    private readonly themeSubscription: vscode.Disposable;

    constructor(private readonly manager: DecorationManager) {
        manager.registerProvider(
            new MathProvider(),
            HIDDEN_SOURCE,
            RAW_SOURCE,
            ['cozy', 'clean'] satisfies DecorationDisplayMode[],
        );
        this.themeSubscription = vscode.window.onDidChangeActiveColorTheme(() => manager.update());
    }

    dispose(): void {
        this.themeSubscription.dispose();
        this.manager.unregisterProvider(ID_MATH);
    }
}

function renderEquation(expression: string, display: boolean, color: string): vscode.Uri {
    const cacheKey = `${color}\u0000${display ? 'display' : 'inline'}\u0000${expression}`;
    const cached = svgCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const node = mathDocument.convert(expression, { display });
    const markup = adaptor.outerHTML(node);
    if (markup.includes('data-mjx-error') || markup.includes('data-mml-node="merror"')) {
        throw new Error('Incomplete or invalid TeX');
    }
    const svgStart = markup.indexOf('<svg');
    const svgEnd = markup.lastIndexOf('</svg>');
    if (svgStart === -1 || svgEnd === -1) {
        throw new Error('MathJax did not produce SVG output');
    }

    const svg = markup
        .slice(svgStart, svgEnd + 6)
        .replace('<svg ', `<svg color="${color}" `);
    const uri = vscode.Uri.parse(`data:image/svg+xml,${encodeURIComponent(svg)}`);
    if (svgCache.size >= 256) {
        svgCache.clear();
    }
    svgCache.set(cacheKey, uri);
    return uri;
}

function equationForeground(): string {
    switch (vscode.window.activeColorTheme.kind) {
        case vscode.ColorThemeKind.Light:
        case vscode.ColorThemeKind.HighContrastLight:
            return '#333333';
        case vscode.ColorThemeKind.HighContrast:
            return '#ffffff';
        default:
            return '#d4d4d4';
    }
}
