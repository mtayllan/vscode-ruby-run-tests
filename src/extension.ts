import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function getTestsFolder(fileDir: string) {
  if (fs.existsSync(path.join(fileDir, 'spec'))) { return 'spec'; }
  if (fs.existsSync(path.join(fileDir, 'test'))) { return 'test'; }

  return null;
}

function getSpecFile(rootFolder: string, currentFileDir: string, currentFileName: string, testsFolder: string) {
  let relativeFilePath = path.relative(rootFolder, currentFileDir);
  if (relativeFilePath.startsWith('app/')) {
    relativeFilePath = relativeFilePath.substring(4); // Remove 'app/' prefix
  }
  const newFileName = currentFileName.replace('.rb', `_${testsFolder}.rb`);
  return path.join(rootFolder, testsFolder, relativeFilePath, newFileName);
}

function getProgramFile(rootFolder: string, currentFileDir: string, currentFileName: string, testsFolder: string) {
  let relativeFilePath = path.relative(rootFolder, currentFileDir).substring(5);
  const newFileName = currentFileName.replace(`_${testsFolder}.rb`, '.rb');
  if (!relativeFilePath.startsWith(`${testsFolder}/lib/`)) {
    relativeFilePath = `app/${relativeFilePath}`; // Add 'app/' prefix
  }
  return path.join(rootFolder, relativeFilePath, newFileName);
}

function toggle() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const currentFileUri = editor.document.uri;

  const currentFilePath = currentFileUri.fsPath;
  const currentFileDir = path.dirname(currentFilePath);
  const currentFileName = path.basename(currentFilePath);

  const rootFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFileDir))?.uri.fsPath;
  if (!rootFolder) { return; }

  const testsFolder = getTestsFolder(rootFolder);
  if (!testsFolder) { return; }

  let fileToOpen = '';
  if (currentFileName.endsWith(`_${testsFolder}.rb`)) {
    fileToOpen = getProgramFile(rootFolder, currentFileDir, currentFileName, testsFolder);
  } else {
    fileToOpen = getSpecFile(rootFolder, currentFileDir, currentFileName, testsFolder);
  }
  return vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fileToOpen));
}

function runTest() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const currentFileUri = editor.document.uri;

  const currentFilePath = currentFileUri.fsPath;
  const currentFileDir = path.dirname(currentFilePath);
  const currentFileName = path.basename(currentFilePath);

  const rootFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFileDir))?.uri.fsPath;
  if (!rootFolder) { return; }

  const testsFolder = getTestsFolder(rootFolder);
  if (!testsFolder) { return; }

  let fileToRun = '';
  if (currentFileName.endsWith(`_${testsFolder}.rb`)) {
    fileToRun = currentFilePath;
  } else {
    fileToRun = getSpecFile(rootFolder, currentFileDir, currentFileName, testsFolder);
  }

  let command = '';
  if (testsFolder === 'spec') {
    command = `bundle exec rspec ${fileToRun}`;
  } else {
    command = `bundle exec rails t ${fileToRun}`;
  }

  if (vscode.window.activeTerminal) {
    vscode.window.activeTerminal.sendText(command);
  } else {
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(command);
  }
}

function runTestForLine() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }

  const currentFileUri = editor.document.uri;

  const currentFilePath = currentFileUri.fsPath;
  const currentFileDir = path.dirname(currentFilePath);

  const rootFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFileDir))?.uri.fsPath;
  if (!rootFolder) { return; }

  const testsFolder = getTestsFolder(rootFolder);
  if (!testsFolder) { return; }

  if (!currentFilePath.endsWith(`_${testsFolder}.rb`)) {return;}

  let command = '';
  if (testsFolder === 'spec') {
    command = `bundle exec rspec ${currentFilePath}`;
  } else {
    command = `bundle exec rails t ${currentFilePath}`;
  }

  const lineNumber = editor.selection.active.line + 1;
  command = `${command}:${lineNumber}`;

  if (vscode.window.activeTerminal) {
    vscode.window.activeTerminal.sendText(command);
  } else {
    const terminal = vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(command);
  }
}

export function activate(context: vscode.ExtensionContext) {
  const toggleCommand = vscode.commands.registerCommand('ruby-run-tests.toggle', toggle);
  const runTestCommand = vscode.commands.registerCommand('ruby-run-tests.run', runTest);
  const runTestForLineCommand = vscode.commands.registerCommand('ruby-run-tests.runForLine', runTestForLine);

  context.subscriptions.push(toggleCommand);
  context.subscriptions.push(runTestCommand);
  context.subscriptions.push(runTestForLineCommand);
}

export function deactivate() { }
