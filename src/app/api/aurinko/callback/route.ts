import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from '@vercel/functions'
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
// import * as dotenv from 'dotenv';
// dotenv.config();

export const GET = async (req: NextRequest) => {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    
    
    console.log("HIIIIII")
    console.log("User ID from Clerk Auth in Aurinko Callback ::: ", userId)

    const params = req.nextUrl.searchParams
    const status = params.get('status');
    if (status !== 'success') return NextResponse.json({ error: "Account connection failed" }, { status: 400 });

    const code = params.get('code');
    // const token = await getAurinkoToken(code as string)

    console.log(`Triggering Aurinko MicroService Callback to setup account sync ::: " , ${process.env.AURINKO_BACKEND_MICROSERVICE_URL}/aurinko/callback`)

    let myUrl = new URL(`${process.env.AURINKO_BACKEND_MICROSERVICE_URL}/aurinko/callback`);
    myUrl.searchParams.append("status", status);
    myUrl.searchParams.append("code", code?code:"");
    myUrl.searchParams.append("user_id", userId);
    const aurink_callback_url = myUrl.toString();
    console.log("Aurinko Callback URL to MicroService ::: ", aurink_callback_url)
    await axios.get(
            aurink_callback_url
    ).then(response => {
            console.log("Aurinko Callback triggered to MicroService ::: ", response.data)
    }).catch(error => {
            console.log("Failed to trigger and setup Aurinko Account intial sync ::: ", error)
    })



    // if (!token) return NextResponse.json({ error: "Failed to fetch token" }, { status: 400 });
    // const accountDetails = await getAccountDetails(token.accessToken)
    // await db.account.upsert({
    //     where: { id: token.accountId.toString() },
    //     create: {
    //         id: token.accountId.toString(),
    //         userId,
    //         token: token.accessToken,
    //         provider: 'Aurinko',
    //         emailAddress: accountDetails.email,
    //         name: accountDetails.name
    //     },
    //     update: {
    //         token: token.accessToken,
    //     }
    // })
    // waitUntil(

    //     axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { accountId: token.accountId.toString(), userId }).then((res) => {
    //         console.log(res.data)
    //     }).catch((err) => {
    //         console.log(err.response.data)
    //     })
    // )

    return NextResponse.redirect(new URL('/mail', req.url))
}