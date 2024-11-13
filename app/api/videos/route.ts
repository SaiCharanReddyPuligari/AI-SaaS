import {NextRequest, NextResponse} from "next/server"
import { PrismaClient } from "@prisma/client"
import exp from "constants";

const primsa = new PrismaClient();

export async function GET(reques:NextRequest) {
    try {
        const videos = await primsa.video.findMany({
            orderBy: {createdAt: "desc"}
        })

        return NextResponse.json(videos)
    } catch (error) {
        return NextResponse.json({error: "Error fetching videos"}, {status: 500})
    } finally{
        await primsa.$disconnect()
    }
}