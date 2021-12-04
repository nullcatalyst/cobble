"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpawnError = exports.spawn = void 0;
const childProcess = require("child_process");
function spawn(command, args, options) {
    return new Promise((resolve, reject) => {
        const stdout = [];
        const stderr = [];
        const process = childProcess.spawn(command, args, options);
        process.on('error', err => {
            reject(err);
        });
        process.on('exit', code => {
            if (code === 0) {
                resolve({
                    stdout: stdout.join(''),
                    stderr: stderr.join(''),
                });
            }
            else {
                reject(new SpawnError(code, stdout.join(''), stderr.join('')));
            }
        });
        process.stdout?.on('data', (data) => {
            stdout.push(data.toString('utf8'));
        });
        process.stderr?.on('data', (data) => {
            stderr.push(data.toString('utf8'));
        });
    });
}
exports.spawn = spawn;
class SpawnError extends Error {
    constructor(code, stdout, stderr) {
        super(`process exited with code ${code}`);
        this.code = code;
        this.stdout = stdout;
        this.stderr = stderr;
    }
}
exports.SpawnError = SpawnError;
