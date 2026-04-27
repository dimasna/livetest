#!/usr/bin/env node
// Enforce pnpm usage
const userAgent = process.env.npm_config_user_agent || '';
const execPath = process.env.npm_execpath || '';

const isNpm = userAgent.startsWith('npm/') || execPath.includes('npm-cli.js');
const isYarn = userAgent.startsWith('yarn/') || execPath.includes('yarn');
const isPnpm = userAgent.startsWith('pnpm/') || execPath.includes('pnpm');

if ((isNpm || isYarn) && !isPnpm) {
  console.error('\n❌ Wrong package manager detected.\nThis project requires pnpm. Please install it: https://pnpm.io/installation\nThen run: pnpm install\n');
  process.exit(1);
}
