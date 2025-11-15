#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { listCommand } from './commands/list';
import { showCommand } from './commands/show';
import { deleteCommand } from './commands/delete';
import { changeCommand } from './commands/change';
import { crCommand } from './commands/cr';
import { serveCommand } from './commands/serve';
import { mappingsCommand } from './commands/mappings';
import { analyzeCommand } from './commands/analyze';
import { traceCommand } from './commands/trace';

const program = new Command();

program
  .name('pottery')
  .description('A planning framework for autonomous software agents')
  .version('1.0.0');

// Add commands
program.addCommand(createCommand);
program.addCommand(listCommand);
program.addCommand(showCommand);
program.addCommand(deleteCommand);
program.addCommand(changeCommand);
program.addCommand(crCommand);
program.addCommand(serveCommand);
program.addCommand(mappingsCommand);
program.addCommand(analyzeCommand);
program.addCommand(traceCommand);

// Parse arguments
program.parse();
