import { Command } from 'commander';
import { listCRCommand } from './list';
import { showCRCommand } from './show';
import { applyCRCommand } from './apply';
import { deleteCRCommand } from './deleteCR';

export const crCommand = new Command('cr')
  .description('Manage change requests');

// Add subcommands
crCommand.addCommand(listCRCommand);
crCommand.addCommand(showCRCommand);
crCommand.addCommand(applyCRCommand);
crCommand.addCommand(deleteCRCommand);
