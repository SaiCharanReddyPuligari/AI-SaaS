import { v2 as cloudinary } from 'cloudinary';
import { NextResponse, NextRequest } from 'next/server';
import {auth} from "@clerk/nextjs/server"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()
//we should upload and store the details in Prisma

// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

interface CloudinartUploadResult{
    public_id: string;
    bytes: number;
    duration?:number;
    [key: string]:any
}
export async function POST(request:NextRequest) {

    try {
        const {userId} = await auth();

    if(!userId){
        return NextResponse.json({error: "Unauthorised"}, {status: 401})
    }

    if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET 
    ){
        return NextResponse.json(
            {error: "Cloudinary Credentials not found"},
            {status: 500}
        )
    }
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;



        if(!file){
            return NextResponse.json({error:"File not found"}, {status: 400})
        }

        const bytes= await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinartUploadResult>((resolve, reject)=>{
          const uploadStream=  cloudinary.uploader.upload_stream(
                {
                    resource_type: "video",
                    folder:"saas-videos-uploads",
                    transformation: [
                        {quality: "auto", fetch_format: "mp4"}
                    ]
                },
                (error, result)=>{
                    if(error) reject(error);
                    else resolve(result as CloudinartUploadResult);
                }
            )
            uploadStream.end(buffer);
        })

        const video = await prisma.video.create({
            data:{
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            }
        })
        return NextResponse.json(video);
    } catch (error) {
        console.log("Upload video failed",error);
        return NextResponse.json(
            {error: "Upload video Failed"},
            {status: 500}
        )
        
    }finally{
        await prisma.$disconnect();
    }
    
}