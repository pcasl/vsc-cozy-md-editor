import * as assert from 'assert';
import { parseMarkdownMath } from '../../../parsers/math';

suite('Markdown Math Parser', () => {
    test('finds inline and display equations', () => {
        const text = 'Inline $x^2 + y^2$ here.\n\n$$\\int_0^1 x dx$$';
        const result = parseMarkdownMath(text);

        assert.deepStrictEqual(
            result.map(item => ({ expression: item.expression, display: item.display })),
            [
                { expression: 'x^2 + y^2', display: false },
                { expression: '\\int_0^1 x dx', display: true },
            ],
        );
    });

    test('supports multiline display equations', () => {
        const result = parseMarkdownMath('$$\na + b\n= c\n$$');

        assert.strictEqual(result.length, 1);
        assert.strictEqual(result[0].expression, 'a + b\n= c');
        assert.strictEqual(result[0].display, true);
    });

    test('does not parse equations anywhere inside CriticMarkup', () => {
        const text = [
            '{++ $added$ ++}',
            '{-- $$deleted$$ --}',
            '{~~ $old$ ~> $new$ ~~}',
            '{>> comment about $x$ <<}',
            '{== $highlighted$ ==}',
            'Outside $visible$.',
        ].join('\n');
        const result = parseMarkdownMath(text);

        assert.deepStrictEqual(result.map(item => item.expression), ['visible']);
    });

    test('keeps CriticMarkup offsets unchanged around equations', () => {
        const text = '$before$ {++ $review syntax$ ++} $after$';
        const result = parseMarkdownMath(text);

        assert.deepStrictEqual(
            result.map(item => text.slice(item.start, item.end)),
            ['$before$', '$after$'],
        );
    });

    test('does not parse equations in inline or fenced code', () => {
        const text = '`$inline$`\n```tex\n$code$\n```\nReal $math$';
        const result = parseMarkdownMath(text);

        assert.deepStrictEqual(result.map(item => item.expression), ['math']);
    });

    test('ignores escaped, incomplete, and whitespace-delimited dollars', () => {
        const text = String.raw`\$escaped$ and $ incomplete and $ prose $`;
        assert.deepStrictEqual(parseMarkdownMath(text), []);
    });
});
