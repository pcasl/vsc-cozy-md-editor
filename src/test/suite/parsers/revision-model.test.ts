import * as assert from 'assert';
import {
    generateCriticMarkup,
    normalizeTrackedChanges,
    projectCriticMarkup,
} from '../../../track-changes/revision-model';

suite('Track Changes Revision Model', () => {
    test('projects original and final revision views', () => {
        const text = 'A {++new++} {--old--} {~~before~>after~~}.';

        assert.strictEqual(
            projectCriticMarkup(text, 'original'),
            'A  old before.'
        );
        assert.strictEqual(
            projectCriticMarkup(text, 'final'),
            'A new  after.'
        );
    });

    test('uses a deletion and addition for a replacement', () => {
        assert.strictEqual(
            generateCriticMarkup('The cat sat.', 'The dog sat.'),
            'The {--cat--}{++dog++} sat.'
        );
    });

    test('preserves exact whitespace in both accept and reject views', () => {
        const original = 'Hello  world.';
        const final = 'Hello wonderful world.';
        const markup = generateCriticMarkup(original, final);

        assert.strictEqual(projectCriticMarkup(markup, 'original'), original);
        assert.strictEqual(projectCriticMarkup(markup, 'final'), final);
    });

    test('extends an existing insertion without nesting', () => {
        const snapshot = 'Hello {++world++}.';
        const edited = 'Hello {++beautiful world++}.';

        assert.strictEqual(
            normalizeTrackedChanges(snapshot, edited),
            'Hello {++beautiful world++}.'
        );
    });

    test('editing an existing insertion replaces its net inserted text', () => {
        const snapshot = 'Hello {++beautiful ++}world.';
        const edited = 'Hello {++wonderful ++}world.';

        const normalized = normalizeTrackedChanges(snapshot, edited);
        assert.strictEqual(normalized, 'Hello {++wonderful ++}world.');
        assert.ok(!normalized.includes('{++{'));
    });

    test('deleting text from an insertion cancels that part of the insertion', () => {
        const snapshot = 'Hello {++beautiful world++}.';
        const edited = 'Hello {++world++}.';

        assert.strictEqual(
            normalizeTrackedChanges(snapshot, edited),
            'Hello {++world++}.'
        );
    });

    test('deleting an entire insertion removes the revision', () => {
        const snapshot = 'Hello {++beautiful ++}world.';
        const edited = 'Hello {++++}world.';

        assert.strictEqual(normalizeTrackedChanges(snapshot, edited), 'Hello world.');
    });

    test('editing the new side of a substitution produces deletion and addition', () => {
        const snapshot = 'The {~~cat~>dog~~} sat.';
        const edited = 'The {~~cat~>fox~~} sat.';

        assert.strictEqual(
            normalizeTrackedChanges(snapshot, edited),
            'The {--cat--}{++fox++} sat.'
        );
    });

    test('edits made inside deleted text do not create nested changes', () => {
        const snapshot = 'Keep {--old text --}this.';
        const edited = 'Keep {--edited text --}this.';

        assert.strictEqual(
            normalizeTrackedChanges(snapshot, edited),
            'Keep {--old text --}this.'
        );
    });

    test('flattens nested revisions created by the old tracker', () => {
        const nested = 'Hello {++{--beautiful --}{++wonderful ++}++}world.';

        assert.strictEqual(
            normalizeTrackedChanges(nested, nested),
            'Hello {++wonderful ++}world.'
        );
    });

    test('preserves unchanged comments and highlights', () => {
        const snapshot = 'Start {>>review this<<} and {==important==} end.';
        const edited = 'New start {>>review this<<} and {==important==} end.';

        const normalized = normalizeTrackedChanges(snapshot, edited);
        assert.ok(normalized.includes('{>>review this<<}'));
        assert.ok(normalized.includes('{==important==}'));
    });
});
