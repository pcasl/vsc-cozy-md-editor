import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('rime.cozy-critic-md'));
    });

    test('Extension activates and registers all display modes', async () => {
        const ext = vscode.extensions.getExtension('rime.cozy-critic-md');
        assert.ok(ext);
        await ext.activate();

        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('cozyMd.enableDecorations'));
        assert.ok(commands.includes('cozyMd.cleanDecorations'));
        assert.ok(commands.includes('cozyMd.disableDecorations'));
    });
});
