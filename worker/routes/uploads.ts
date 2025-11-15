import { Hono } from 'hono';
import type { Env } from '../index';

export const uploadRoutes = new Hono<{ Bindings: Env }>();

/**
 * Upload a file to R2 storage
 */
async function uploadToR2(
  r2: R2Bucket,
  file: File,
  folder: string = ''
): Promise<{ url: string; key: string; size: number }> {
  // Generate unique filename
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = file.name.split('.').pop();
  const filename = `${timestamp}-${random}.${extension}`;

  // Create R2 key with folder
  const key = folder ? `${folder}/${filename}` : filename;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await r2.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });

  // Return file info
  // Note: You'll need to configure a public domain for R2 bucket
  // or use signed URLs for private access
  return {
    url: `/uploads/${key}`,
    key,
    size: file.size,
  };
}

/**
 * POST /api/upload/file
 * Upload a general file
 */
uploadRoutes.post('/file', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const result = await uploadToR2(c.env.UPLOADS, file);

    return c.json({
      url: result.url,
      originalName: file.name,
      size: result.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return c.json({ error: 'Failed to upload file' }, 500);
  }
});

/**
 * POST /api/upload/image
 * Upload an image file
 */
uploadRoutes.post('/image', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return c.json({ error: 'No image provided' }, 400);
    }

    // Validate that it's an image
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400);
    }

    const result = await uploadToR2(c.env.UPLOADS, file, 'images');

    return c.json({
      url: result.url,
      originalName: file.name,
      size: result.size,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

/**
 * POST /api/upload/datasheet
 * Upload a datasheet file (typically PDF)
 */
uploadRoutes.post('/datasheet', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('datasheet') as File;

    if (!file) {
      return c.json({ error: 'No datasheet provided' }, 400);
    }

    const result = await uploadToR2(c.env.UPLOADS, file, 'datasheets');

    return c.json({
      url: result.url,
      originalName: file.name,
      size: result.size,
    });
  } catch (error) {
    console.error('Error uploading datasheet:', error);
    return c.json({ error: 'Failed to upload datasheet' }, 500);
  }
});

/**
 * GET /uploads/*
 * Serve files from R2
 */
uploadRoutes.get('/*', async (c) => {
  try {
    // Extract the file key from the path
    const path = c.req.path.replace('/uploads/', '');

    if (!path) {
      return c.json({ error: 'No file specified' }, 400);
    }

    // Get file from R2
    const object = await c.env.UPLOADS.get(path);

    if (!object) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Get file metadata
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Return file
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return c.json({ error: 'Failed to retrieve file' }, 500);
  }
});
