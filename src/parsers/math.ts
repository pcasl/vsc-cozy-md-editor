import { parseCriticMarkup } from './criticmarkup';

export interface MarkdownMathRange {
    start: number;
    end: number;
    source: string;
    expression: string;
    display: boolean;
}

/**
 * Find dollar-delimited LaTeX without treating CriticMarkup or code as math.
 * Keeping this parser independent from the decoration layer makes the
 * isolation rule easy to test and prevents equation rendering from changing
 * the CriticMarkup parser or its ranges.
 */
export function parseMarkdownMath(text: string): MarkdownMathRange[] {
    if (!text) {
        return [];
    }

    const excluded = new Uint8Array(text.length);

    for (const range of parseCriticMarkup(text)) {
        mark(excluded, range.start, range.end);
    }
    markFencedCode(text, excluded);
    markInlineCode(text, excluded);

    const ranges: MarkdownMathRange[] = [];
    let offset = 0;

    while (offset < text.length) {
        if (excluded[offset] || text[offset] !== '$' || isEscaped(text, offset)) {
            offset++;
            continue;
        }

        const display = text[offset + 1] === '$';
        const delimiterLength = display ? 2 : 1;
        const contentStart = offset + delimiterLength;

        // `$ value $` is prose/currency rather than an inline equation. Empty
        // display equations are likewise ignored while the user is typing.
        if (contentStart >= text.length || (!display && /\s/.test(text[contentStart]))) {
            offset += delimiterLength;
            continue;
        }

        const closing = findClosingDelimiter(
            text,
            excluded,
            contentStart,
            delimiterLength,
            display,
        );

        if (closing === -1) {
            offset += delimiterLength;
            continue;
        }

        const expression = text.slice(contentStart, closing).trim();
        if (!expression) {
            offset = closing + delimiterLength;
            continue;
        }

        const end = closing + delimiterLength;
        ranges.push({
            start: offset,
            end,
            source: text.slice(offset, end),
            expression,
            display,
        });
        mark(excluded, offset, end);
        offset = end;
    }

    return ranges;
}

function findClosingDelimiter(
    text: string,
    excluded: Uint8Array,
    start: number,
    delimiterLength: number,
    display: boolean,
): number {
    for (let i = start; i < text.length; i++) {
        if (!display && text[i] === '\n') {
            return -1;
        }
        if (excluded[i] || text[i] !== '$' || isEscaped(text, i)) {
            continue;
        }

        if (delimiterLength === 2) {
            if (text[i + 1] === '$' && !excluded[i + 1]) {
                return i;
            }
            continue;
        }

        if (text[i + 1] !== '$' && i > start && !/\s/.test(text[i - 1])) {
            return i;
        }
    }
    return -1;
}

function markFencedCode(text: string, excluded: Uint8Array): void {
    const linePattern = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n|$)/gm;
    let opening: RegExpExecArray | null;

    while ((opening = linePattern.exec(text)) !== null) {
        if (excluded[opening.index]) {
            continue;
        }

        const marker = opening[1][0];
        const minimumLength = opening[1].length;
        const closePattern = new RegExp(`^ {0,3}${escapeRegExp(marker)}{${minimumLength},}\\s*(?:\\n|$)`, 'gm');
        closePattern.lastIndex = linePattern.lastIndex;
        const closing = closePattern.exec(text);
        const end = closing ? closing.index + closing[0].length : text.length;
        mark(excluded, opening.index, end);
        linePattern.lastIndex = end;
    }
}

function markInlineCode(text: string, excluded: Uint8Array): void {
    const lines = /[^\n]*/g;
    let line: RegExpExecArray | null;
    while ((line = lines.exec(text)) !== null) {
        const codePattern = /(`+)(.+?)\1/g;
        let code: RegExpExecArray | null;
        while ((code = codePattern.exec(line[0])) !== null) {
            const start = line.index + code.index;
            if (!excluded[start]) {
                mark(excluded, start, start + code[0].length);
            }
        }
        if (lines.lastIndex === text.length) {
            break;
        }
        lines.lastIndex++;
    }
}

function isEscaped(text: string, offset: number): boolean {
    let backslashes = 0;
    for (let i = offset - 1; i >= 0 && text[i] === '\\'; i--) {
        backslashes++;
    }
    return backslashes % 2 === 1;
}

function mark(target: Uint8Array, start: number, end: number): void {
    target.fill(1, start, end);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
