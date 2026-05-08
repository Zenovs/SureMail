#!/usr/bin/env node
const { spawn } = require('child_process');

delete process.env.ELECTRON_RUN_AS_NODE;
process.env.NODE_ENV = 'development';

const electron = require('electron');
const child = spawn(electron, ['.'], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
