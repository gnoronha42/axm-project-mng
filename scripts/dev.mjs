#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: false,
      cwd: opts.cwd ?? root,
      env: { ...process.env, ...opts.env },
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} falhou (code ${code})`))));
  });
}

function waitPort(port, host = '127.0.0.1', attempts = 40) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const tryConnect = () => {
      const socket = createConnection({ port, host }, () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        tries += 1;
        if (tries >= attempts) reject(new Error(`Porta ${port} indisponível`));
        else setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });
}

function ensureServerEnv() {
  const envPath = path.join(serverDir, '.env');
  if (!existsSync(envPath)) {
    copyFileSync(path.join(serverDir, '.env.example'), envPath);
    console.log('📝 Criado server/.env');
  }
}

function startDevServers() {
  const children = [
    { name: 'web', proc: spawn('npm', ['run', 'dev:web'], { stdio: 'inherit', cwd: root, env: process.env }) },
    { name: 'api', proc: spawn('npm', ['run', 'dev:api'], { stdio: 'inherit', cwd: root, env: process.env }) },
  ];

  const shutdown = () => {
    for (const { proc } of children) {
      if (!proc.killed) proc.kill('SIGTERM');
    }
  };

  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
  });

  for (const { name, proc } of children) {
    proc.on('exit', (code, signal) => {
      console.error(`\n[${name}] encerrou (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
      shutdown();
      process.exit(code ?? 1);
    });
  }
}

async function main() {
  console.log('🐘 Subindo PostgreSQL (Docker)...');
  await run('docker-compose', ['up', '-d', 'postgres'], { cwd: root });

  console.log('⏳ Aguardando PostgreSQL na porta 5432...');
  await waitPort(5432);

  ensureServerEnv();

  if (!existsSync(path.join(serverDir, 'node_modules'))) {
    console.log('📦 Instalando dependências da API...');
    await run('npm', ['install'], { cwd: serverDir });
  }

  console.log('🗄️  Aplicando schema e seed...');
  await run('npm', ['run', 'db:setup'], { cwd: serverDir });

  if (!existsSync(path.join(root, '.env.local'))) {
    writeFileSync(path.join(root, '.env.local'), 'VITE_API_URL=/api\n');
    console.log('📝 Criado .env.local (VITE_API_URL=/api)');
  }

  console.log('🚀 Front: http://localhost:5173  |  API: http://localhost:3001\n');

  startDevServers();
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
