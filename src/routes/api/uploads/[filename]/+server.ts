import { promises as fs } from 'fs';
import path from 'path';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    // Get the filename from the query parameters
    const filename = params.filename;

    if (!filename) {
      return new Response('Filename query parameter is required', { status: 400 });
    }

    console.log('Requested file:', filename);

    // Define the file path
    const filePath = path.join('build', 'client', 'uploads', filename);

    // Check if the file exists
    try {
      await fs.access(filePath);
    } catch (e) {
      return new Response('File not found', { status: 404 });
    }

    // Read the file and return it
    const fileData = await fs.readFile(filePath);
    const fileExtension = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream'; // Default content type for unknown file types

    // Set the appropriate content type based on the file extension
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else if (fileExtension === '.gif') {
      contentType = 'image/gif';
    } else if (fileExtension === '.bmp') {
      contentType = 'image/bmp';
    }

    return new Response(fileData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${filename}"`, // Use 'inline' instead of 'attachment' to display the image in the browser
      },
    });
  } catch (error) {
    console.error('File download error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
