import type { RequestHandler } from '@sveltejs/kit';
import { promises as fs } from 'fs';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = file?.name;

    await fs.writeFile(filename, file.stream());
    
    return new Response('200');
  } catch (error) {
    return new Response('500');
  }
}
