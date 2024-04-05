// import type { RequestHandler } from '@sveltejs/kit';
import { put } from '@vercel/blob';

export const POST = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('file') as File;

    console.log('imageFile.name: ', imageFile.name);

    try {
      const blob = await put(imageFile.name, imageFile.stream(), {
        access: 'public'
      });
      // revalidatePath('/');
      console.log('blob: ', blob);
    } catch (error) {
      console.log('blob error on api: ', error);
    }

    return new Response(JSON.stringify(blob), {status: 200});
  } catch (error) {
    return new Response('500');
  }
}
