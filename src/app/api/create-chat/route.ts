import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { getS3Url } from "@/lib/s3";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// /api/create-chat
export async function POST(req: Request, res: Response) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { file_key, file_name } = body;
    const obj = {
      fileKey: file_key,
      pdfName: file_name,
      pdfUrl: getS3Url(file_key),
      userId,
    }
    try {
      const x = await loadS3IntoPinecone(file_key);
    } catch (err) {
      console.error(err);
    }
    const chat_id = await db
      .insert(chats)
      .values(obj)
      .returning({
        insertedId: chats.id,
      });

    console.log('chat_id is: ', chat_id);

    return NextResponse.json(
      {
        chat_id: chat_id[0].insertedId,
      },
      { status: 200 }
    );
  } catch (error) {
    // console.log('error is: ', error);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
