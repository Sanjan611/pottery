import { NextResponse } from 'next/server';
import { GlobalProjectStore } from '@pottery/core';

export async function GET() {
  try {
    const store = new GlobalProjectStore();
    const projects = await store.listProjects();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error listing projects:', error);
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    );
  }
}
