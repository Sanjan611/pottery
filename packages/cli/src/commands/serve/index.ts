import { Command } from 'commander';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import open from 'open';
import { ProjectStore } from '@pottery/core';

const execAsync = promisify(exec);

const SERVER_PID_FILE = path.join(
  process.env.HOME || '~',
  '.pottery',
  'servers.json'
);

interface ServerInfo {
  port: number;
  projectId: string;
  pid: number;
  startedAt: string;
}

export const serveCommand = new Command('serve')
  .description('Manage web UI server')
  .option('--project-id <id>', 'Project ID to serve')
  .option('--port <port>', 'Port number', '3000')
  .action(async (options) => {
    if (!options.projectId) {
      console.error(chalk.red('Error: --project-id is required'));
      process.exit(1);
    }

    await startServer(options.projectId, parseInt(options.port));
  });

serveCommand
  .command('stop')
  .description('Stop web UI server(s)')
  .option('--port <port>', 'Port to stop (if not specified, stops all)')
  .action(async (options) => {
    await stopServer(options.port ? parseInt(options.port) : undefined);
  });

serveCommand
  .command('list')
  .description('List running web UI servers')
  .action(async () => {
    await listServers();
  });

async function startServer(projectId: string, port: number) {
  // Verify project exists
  const store = new ProjectStore(projectId);

  try {
    await store.loadMetadata();
  } catch (error) {
    console.error(chalk.red(`Error: Project ${projectId} not found`));
    process.exit(1);
  }

  // Check if port is already in use
  const servers = await loadServers();
  if (servers.find(s => s.port === port)) {
    console.error(chalk.red(`Error: Port ${port} is already in use`));
    process.exit(1);
  }

  console.log(chalk.blue('🌐 Starting Pottery server...'));

  // Find the web package path relative to CLI
  const webPackagePath = path.resolve(__dirname, '../../../web');

  // Start Next.js server in detached mode
  const serverProcess = spawn(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    ['--filter', '@pottery/web', 'dev', '--port', port.toString()],
    {
      detached: true,
      stdio: 'ignore',
      cwd: path.resolve(__dirname, '../../../..'), // Go to monorepo root
    }
  );

  serverProcess.unref();

  // Save server info
  servers.push({
    port,
    projectId,
    pid: serverProcess.pid!,
    startedAt: new Date().toISOString()
  });
  await saveServers(servers);

  console.log(chalk.green('✓') + ' Server running at ' + chalk.cyan(`http://localhost:${port}`));
  console.log(`  Project: ${projectId}`);
  console.log(`  PID: ${serverProcess.pid}`);
  console.log();
  console.log(chalk.dim('💡 View server status: pottery serve list'));
  console.log(chalk.dim('   Stop server: pottery serve stop --port ' + port));

  // Wait a moment for server to start, then open browser
  setTimeout(async () => {
    console.log('\nOpening browser...');
    try {
      await open(`http://localhost:${port}/projects/${projectId}`);
    } catch (error) {
      console.log(chalk.yellow('Could not open browser automatically. Please navigate to the URL above.'));
    }
  }, 3000);
}

async function stopServer(port?: number) {
  const servers = await loadServers();

  if (port) {
    // Stop specific server
    const server = servers.find(s => s.port === port);
    if (!server) {
      console.error(chalk.red(`No server running on port ${port}`));
      return;
    }

    try {
      process.kill(server.pid);
      console.log(chalk.green('✓') + ` Stopped server on port ${port}`);
    } catch (error: any) {
      console.error(chalk.red(`Failed to stop server: ${error.message}`));
    }

    await saveServers(servers.filter(s => s.port !== port));
  } else {
    // Stop all servers
    if (servers.length === 0) {
      console.log('No servers running');
      return;
    }

    for (const server of servers) {
      try {
        process.kill(server.pid);
        console.log(chalk.green('✓') + ` Stopped server on port ${server.port}`);
      } catch (error) {
        console.error(chalk.red(`Failed to stop server on port ${server.port}`));
      }
    }

    await saveServers([]);
  }
}

async function listServers() {
  const servers = await loadServers();

  if (servers.length === 0) {
    console.log('No servers running');
    return;
  }

  console.log(chalk.bold(`Running servers (${servers.length}):\n`));

  for (const server of servers) {
    console.log(`  Port ${chalk.cyan(server.port)}  ${server.projectId}  PID: ${server.pid}`);
  }

  console.log();
  console.log('Stop a server: pottery serve stop --port <port>');
  console.log('Stop all: pottery serve stop');
}

async function loadServers(): Promise<ServerInfo[]> {
  try {
    return await fs.readJSON(SERVER_PID_FILE);
  } catch {
    return [];
  }
}

async function saveServers(servers: ServerInfo[]) {
  await fs.ensureDir(path.dirname(SERVER_PID_FILE));
  await fs.writeJSON(SERVER_PID_FILE, servers, { spaces: 2 });
}
