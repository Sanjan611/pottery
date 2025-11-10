import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { ChangeRequest, ProjectMetadata } from '@pottery/core';

export function formatCRSummary(cr: ChangeRequest, projectId: string): string {
  const lines: string[] = [];

  lines.push(chalk.bold(`Project: ${projectId}`));
  lines.push(chalk.gray(`Status: ${cr.status === 'pending' ? chalk.yellow('Pending') : chalk.green('Applied')}`));
  lines.push('');

  if (cr.new_nodes.length > 0) {
    lines.push(chalk.green(`🆕 New Nodes: ${cr.new_nodes.length}`));

    // Group nodes by type
    const intentNodes = cr.new_nodes.filter(n => n.id.startsWith('intent-'));
    const subIntentNodes = cr.new_nodes.filter(n => n.id.startsWith('subintent-'));
    const featureNodes = cr.new_nodes.filter(n => n.id.startsWith('feature-'));
    const taskNodes = cr.new_nodes.filter(n => n.id.startsWith('task-'));

    if (intentNodes.length > 0) {
      intentNodes.forEach(node => {
        if ('name' in node) {
          lines.push(`  └─ ProductIntent: ${node.name}`);
        }
      });
    }

    if (subIntentNodes.length > 0) {
      subIntentNodes.forEach((node, idx) => {
        if ('name' in node) {
          const prefix = idx === subIntentNodes.length - 1 && featureNodes.length === 0 && taskNodes.length === 0 ? '└─' : '├─';
          lines.push(`  ${prefix} SubIntent: ${node.name}`);
        }
      });
    }

    if (featureNodes.length > 0) {
      lines.push(`  ├─ ${featureNodes.length} Features`);
    }

    if (taskNodes.length > 0) {
      lines.push(`  └─ ${taskNodes.length} Tasks`);
    }
  }

  if (cr.modified_nodes.length > 0) {
    lines.push('');
    lines.push(chalk.yellow(`🔄 Modified Nodes: ${cr.modified_nodes.length}`));
  }

  if (cr.new_dependencies.length > 0) {
    lines.push('');
    lines.push(chalk.blue(`🔗 New Dependencies: ${cr.new_dependencies.length}`));
  }

  if (cr.impact_map.length > 0) {
    lines.push('');
    lines.push(chalk.magenta(`📍 Impact Map:`));
    cr.impact_map.slice(0, 3).forEach(impact => {
      const icon = impact.impact_type === 'aligned' ? '✓' : impact.impact_type === 'conflicts' ? '✗' : '~';
      lines.push(`  ${icon} ${impact.node_type}: ${impact.node_id}`);
    });
    if (cr.impact_map.length > 3) {
      lines.push(`  ... and ${cr.impact_map.length - 3} more`);
    }
  }

  return lines.join('\n');
}

export function formatCRDetail(cr: ChangeRequest): string {
  const lines: string[] = [];

  lines.push(chalk.bold.cyan(`ChangeRequest ${cr.id}`));
  lines.push('');
  lines.push(chalk.gray(`Description: ${cr.description}`));
  lines.push(chalk.gray(`Status: ${cr.status === 'pending' ? chalk.yellow('Pending') : chalk.green('Applied')}`));
  lines.push(chalk.gray(`Created: ${new Date(cr.created_at).toLocaleString()}`));
  if (cr.applied_at) {
    lines.push(chalk.gray(`Applied: ${new Date(cr.applied_at).toLocaleString()}`));
  }
  lines.push('');

  if (cr.new_nodes.length > 0) {
    lines.push(chalk.green.bold(`🆕 New Nodes (${cr.new_nodes.length}):`));
    cr.new_nodes.forEach(node => {
      if ('name' in node) {
        lines.push(`  └─ ${chalk.cyan(node.id)}: ${node.name}`);
      } else if ('description' in node) {
        const desc = node.description.slice(0, 60);
        lines.push(`  └─ ${chalk.cyan(node.id)}: ${desc}...`);
      } else {
        lines.push(`  └─ ${chalk.cyan(node.id)}`);
      }
    });
    lines.push('');
  }

  if (cr.modified_nodes.length > 0) {
    lines.push(chalk.yellow.bold(`🔄 Modified Nodes (${cr.modified_nodes.length}):`));
    cr.modified_nodes.forEach(mod => {
      lines.push(`  └─ ${chalk.cyan(mod.node_id)}: ${mod.old_version} → ${mod.new_version}`);
    });
    lines.push('');
  }

  if (cr.new_dependencies.length > 0) {
    lines.push(chalk.blue.bold(`🔗 New Dependencies (${cr.new_dependencies.length}):`));
    cr.new_dependencies.forEach(dep => {
      lines.push(`  ├─ ${dep.from_id} → ${dep.to_id} (${dep.type})`);
    });
    lines.push('');
  }

  if (cr.impact_map.length > 0) {
    lines.push(chalk.magenta.bold(`📍 Impact Map:`));
    cr.impact_map.forEach(impact => {
      const icon = impact.impact_type === 'aligned' ? chalk.green('✓') :
                   impact.impact_type === 'conflicts' ? chalk.red('✗') : chalk.yellow('~');
      lines.push(`  ${icon} ${impact.node_type}: ${impact.node_id}`);
      if (impact.reason) {
        lines.push(`     ${chalk.gray(impact.reason)}`);
      }
    });
  }

  return lines.join('\n');
}

export function formatProjectList(projects: ProjectMetadata[]): string {
  if (projects.length === 0) {
    return chalk.gray('No projects found. Create one with: pottery create --intent "your idea"');
  }

  const table = new Table({
    head: [
      chalk.cyan('Project ID'),
      chalk.cyan('Name'),
      chalk.cyan('Version'),
      chalk.cyan('Created')
    ],
    style: {
      head: [],
      border: ['gray']
    }
  });

  projects.forEach(project => {
    const createdDate = new Date(project.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    let timeAgo: string;
    if (diffDays === 0) {
      timeAgo = 'today';
    } else if (diffDays === 1) {
      timeAgo = 'yesterday';
    } else if (diffDays < 7) {
      timeAgo = `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      timeAgo = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      timeAgo = `${months} month${months > 1 ? 's' : ''} ago`;
    }

    table.push([
      project.project_id,
      project.name || chalk.gray('(unnamed)'),
      project.current_version,
      timeAgo
    ]);
  });

  return table.toString();
}

export function formatCRList(crs: ChangeRequest[]): string {
  const pending = crs.filter(cr => cr.status === 'pending');
  const applied = crs.filter(cr => cr.status === 'applied');

  const lines: string[] = [];

  if (pending.length > 0) {
    lines.push(chalk.yellow.bold(`Pending (${pending.length}):`));
    pending.forEach(cr => {
      const created = new Date(cr.created_at);
      const timeAgo = formatTimeAgo(created);
      lines.push(`  ${chalk.cyan(cr.id)}  ${cr.description.slice(0, 40).padEnd(42)}  ${chalk.gray(timeAgo)}`);
    });
    lines.push('');
  }

  if (applied.length > 0) {
    lines.push(chalk.green.bold(`Applied (${applied.length}):`));
    applied.slice(0, 5).forEach(cr => {
      const applied = new Date(cr.applied_at || cr.created_at);
      const timeAgo = formatTimeAgo(applied);
      lines.push(`  ${chalk.cyan(cr.id)}  ${cr.description.slice(0, 40).padEnd(42)}  ${chalk.gray(timeAgo)}`);
    });
    if (applied.length > 5) {
      lines.push(chalk.gray(`  ... and ${applied.length - 5} more`));
    }
  }

  if (crs.length === 0) {
    return chalk.gray('No change requests found.');
  }

  return lines.join('\n');
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
}

export function generateProjectId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'proj_';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
