import { diffWordsWithSpace } from 'diff';

export type RevisionView = 'original' | 'final';

interface ProjectionResult {
    text: string;
    index: number;
    stop?: string;
}

interface ProjectedRevision {
    text: string;
    nextIndex: number;
}

/**
 * Project a CriticMarkup document into the text before or after its revisions.
 *
 * This is the important distinction between Word-style revisions and diffing
 * the literal markup source. An addition has no text in the original view, a
 * deletion has no text in the final view, and a substitution has one value in
 * each view. Projecting first also lets us flatten CriticMarkup accidentally
 * nested by older versions of the tracker.
 */
export function projectCriticMarkup(text: string, view: RevisionView): string {
    return projectSequence(text, 0, view, []).text;
}

/**
 * Compose the revisions already in a document with a new round of editing.
 *
 * The snapshot's original view is the stable baseline. The edited document's
 * final view is the desired result. Diffing those semantic views implements
 * the same normalization users expect from Word:
 *
 * - editing an insertion updates that insertion instead of nesting a revision;
 * - deleting inserted text cancels that part of the insertion;
 * - editing the new side of a substitution produces one deletion and addition;
 * - text inside a deletion remains deleted.
 */
export function normalizeTrackedChanges(snapshot: string, editedText: string): string {
    const originalText = projectCriticMarkup(snapshot, 'original');
    const finalText = projectCriticMarkup(editedText, 'final');
    return generateCriticMarkup(originalText, finalText);
}

/**
 * Convert two plain-text document states into flat CriticMarkup.
 * Replacements are emitted as an adjacent deletion and addition. This keeps
 * the old and new text independently reviewable in Cozy's CriticMarkup UI.
 */
export function generateCriticMarkup(oldText: string, newText: string): string {
    // diffWords() intentionally normalizes whitespace and can therefore make
    // accept/reject fail to reproduce the exact input. The with-space variant
    // keeps both document states lossless.
    const changes = diffWordsWithSpace(oldText, newText);
    let result = '';

    for (let i = 0; i < changes.length; i++) {
        const change = changes[i];

        if (!change.added && !change.removed) {
            result += change.value;
            continue;
        }

        let removedText = '';
        let addedText = '';

        // Collect a complete replacement hunk. Whitespace between changed
        // words belongs to both sides so phrase replacements stay together.
        while (i < changes.length) {
            const hunkPart = changes[i];

            if (hunkPart.removed) {
                removedText += hunkPart.value;
            } else if (hunkPart.added) {
                addedText += hunkPart.value;
            } else if (/^\s+$/.test(hunkPart.value) &&
                (changes[i + 1]?.added || changes[i + 1]?.removed)) {
                removedText += hunkPart.value;
                addedText += hunkPart.value;
            } else {
                break;
            }

            i++;
        }
        i--;

        if (removedText) {
            result += `{--${removedText}--}`;
        }
        if (addedText) {
            result += `{++${addedText}++}`;
        }
    }

    return result;
}

function projectSequence(
    source: string,
    startIndex: number,
    view: RevisionView,
    stopTokens: string[]
): ProjectionResult {
    let text = '';
    let index = startIndex;

    while (index < source.length) {
        const stop = stopTokens.find(token => source.startsWith(token, index));
        if (stop) {
            return { text, index, stop };
        }

        const revision = projectRevisionAt(source, index, view);
        if (revision) {
            text += revision.text;
            index = revision.nextIndex;
            continue;
        }

        text += source[index];
        index++;
    }

    return { text, index };
}

function projectRevisionAt(
    source: string,
    index: number,
    view: RevisionView
): ProjectedRevision | null {
    if (source.startsWith('{++', index)) {
        const inner = projectSequence(source, index + 3, 'final', ['++}']);
        if (inner.stop !== '++}') {
            return null;
        }
        return {
            text: view === 'final' ? inner.text : '',
            nextIndex: inner.index + 3,
        };
    }

    if (source.startsWith('{--', index)) {
        const inner = projectSequence(source, index + 3, 'original', ['--}']);
        if (inner.stop !== '--}') {
            return null;
        }
        return {
            text: view === 'original' ? inner.text : '',
            nextIndex: inner.index + 3,
        };
    }

    if (source.startsWith('{~~', index)) {
        const oldSide = projectSequence(source, index + 3, 'original', ['~>', '~~}']);
        if (oldSide.stop !== '~>') {
            return null;
        }

        const newSide = projectSequence(source, oldSide.index + 2, 'final', ['~~}']);
        if (newSide.stop !== '~~}') {
            return null;
        }

        return {
            text: view === 'original' ? oldSide.text : newSide.text,
            nextIndex: newSide.index + 3,
        };
    }

    // Comments and highlights are annotations, not revisions. Preserve them
    // verbatim in both views so an unrelated tracking pass does not erase them.
    if (source.startsWith('{>>', index)) {
        return projectOpaqueRange(source, index, '<<}');
    }

    if (source.startsWith('{==', index)) {
        return projectOpaqueRange(source, index, '==}');
    }

    return null;
}

function projectOpaqueRange(
    source: string,
    index: number,
    closingToken: string
): ProjectedRevision | null {
    const closingIndex = source.indexOf(closingToken, index + 3);
    if (closingIndex === -1) {
        return null;
    }

    const nextIndex = closingIndex + closingToken.length;
    return {
        text: source.slice(index, nextIndex),
        nextIndex,
    };
}
