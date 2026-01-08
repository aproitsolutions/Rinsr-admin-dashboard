import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const relativeUploadDir = `/uploads`;
    const uploadDir = join(process.cwd(), 'public', relativeUploadDir);

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore error if it exists
    }

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/\s+/g, '-')}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const fileUrl = `${relativeUploadDir}/${filename}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: 'File uploaded locally'
    });
  } catch (error: any) {
    console.error('Local Upload Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal Server Error',
        error: error.message
      },
      { status: 500 }
    );
  }
}
