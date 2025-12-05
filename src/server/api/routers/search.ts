import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { authoriseAccountAccess } from "./account";
import { OramaManager } from "@/lib/orama";
import { getEmbeddings } from "@/lib/embeddings";
import axios from "axios";

export const searchRouter = createTRPCRouter({
    search: protectedProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).mutation(async ({ input, ctx }) => {
        // const account = await ctx.db.account.findFirst({
        //     where: {
        //         id: input.accountId,
        //         userId: ctx.auth.userId,
        //     },
        //     select: {
        //         id: true
        //     }
        // })

        // if (!account) throw new Error("Invalid token")
        // const oramaManager = new OramaManager(account.id);
        // await oramaManager.initialize();


        // const { query } = input;
        // const results = await oramaManager.search({ term: query });
        // return results
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        
        // / account/search-emails
        // accountId: str = Query(...),
        // query: str = Query(...)
        const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/search-emails`,
                {
                    params: {
                       "accountId": input.accountId,
                        "query": input.query
                    }
                }
            )
        console.log("Orama Search Results fetched from Account Service ::: ", data) 
        return data.results
        
    }),
});
