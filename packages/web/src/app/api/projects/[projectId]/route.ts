import { NextResponse } from 'next/server';
import { ProjectStore } from '@pottery/core';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const store = new ProjectStore(projectId);

    // Check if project exists
    const exists = await store.exists();
    if (!exists) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const metadata = await store.loadMetadata();

    return NextResponse.json({ project: metadata });
  } catch (error) {
    console.error('Error loading project:', error);
    return NextResponse.json(
      { error: 'Failed to load project' },
      { status: 500 }
    );
  }
}
