// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const HashMap = require('./hashmap.js');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    if (vscode.workspace.workspaceFolders) {
        
        let config = vscode.workspace.getConfiguration('cscope');
        let path = config.get('path');
        let database = config.get('database');
        let cprovider = new CscopeProvider(path, database);
        context.subscriptions.push(vscode.languages.registerReferenceProvider(["cpp", "c", "C", "CPP"], cprovider));
        context.subscriptions.push(vscode.languages.registerDefinitionProvider(["cpp", "c", "C", "CPP"], cprovider));
    }
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

class CscopeProvider {

    constructor(path, database) {
        this.path = path;
        this.database = database;
    }

    async find(symbol, level) {
        let command = "cscope -f " + this.database + " -s " + this.path + " -L -" + level+ " " + symbol;
        let { stdout, stderr } = await exec(command, { cwd: this.path });
        let lines = stdout.toString().split('\n');
        let myarr = [];
        for (let line of lines) {
            let parts = line.split(' ');
            if (parts.length > 1) {
                myarr.push(new vscode.Location(vscode.Uri.file(parts[0]), 
                            new vscode.Range(new vscode.Position(parseInt(parts[2]) - 1, 0),
                                new vscode.Position(parseInt(parts[2]) - 1, 0))));
            }
        }
        return myarr;
    }

    provideReferences(document, position, options, token) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        return this.find(symbol, 0);
    }

    provideDefinition(document, position, token) {
        const symbol = document.getText(document.getWordRangeAtPosition(position));
        return this.find(symbol, 1);
    }
}
