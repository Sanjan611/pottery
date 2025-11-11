import fs from 'fs-extra';
import path from 'path';
import { ProjectMetadata } from '../models/Project';
import { ProjectStore } from './ProjectStore';

export class GlobalProjectStore {
  private basePath: string;

  constructor(customBasePath?: string) {
    const home = process.env.HOME || process.env.USERPROFILE || '~';
    const potteryHome = customBasePath || path.join(home, '.pottery');
    this.basePath = path.join(potteryHome, 'projects');
  }

  /**
   * List all projects
   */
  async listProjects(): Promise<ProjectMetadata[]> {
    await fs.ensureDir(this.basePath);

    const dirs = await fs.readdir(this.basePath);

    const projects: ProjectMetadata[] = [];

    for (const dir of dirs) {
      const dirPath = path.join(this.basePath, dir);
      const stat = await fs.stat(dirPath);

      if (stat.isDirectory()) {
        try {
          const store = new ProjectStore(dir, path.dirname(this.basePath));
          const metadata = await store.loadMetadata();
          projects.push(metadata);
        } catch (error) {
          // Skip invalid project directories
          console.warn(`Skipping invalid project directory: ${dir}`);
        }
      }
    }

    return projects.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const store = new ProjectStore(projectId, path.dirname(this.basePath));
    await store.delete();
  }

  /**
   * Check if a project exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    const store = new ProjectStore(projectId, path.dirname(this.basePath));
    return await store.exists();
  }
}
