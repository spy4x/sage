import { promises as fs } from 'fs';
import path from 'path';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // Extract the form data binary
    const data = await request.formData();
    const file = data.get('file') as File | null;

    // Ensure a file was received
    if (!file || file.size === 0) {
      return new Response('No file uploaded', { status: 400 });
    }

    // Define the target path
    const randomName = Math.random().toString().substring(2, 7);
    const ext = path.extname(file.name);
    const filename = randomName + ext;
    const targetPath = path.join('build', 'client', 'uploads', filename);
    // Create the directory if it doesn't exist
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Convert file to buffer and save locally
    const buffer = await file.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(buffer));

    return new Response(JSON.stringify({ path: `api/uploads/${filename}` }), { status: 200 });
  } catch (error) {
    console.error('File upload error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
