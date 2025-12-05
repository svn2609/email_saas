import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import Account from "@/lib/account";
import { db } from "@/server/db";
import { getEmailDetails } from "@/lib/aurinko";
import type { Prisma } from "@prisma/client";
import { emailAddressSchema } from "@/lib/types";
import axios from "axios";
import { TRPCError } from "@trpc/server";

export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    // const account = await db.account.findFirst({
    //     where: {
    //         id: accountId,
    //         userId: userId,
    //     },
    //     select: {
    //         id: true, emailAddress: true, name: true, accessToken: true
    //     }
    // })
    // if (!account) throw new Error("Invalid token")
    // return account
        const { data } = await axios.get(
        `${process.env.ACCOUNT_SERVICE_URL}/account/getAccount`,
        {
            params: {
                "accountId": accountId,
                "user_id": userId
            }
        }
    )
    const account = data.account
    console.log("!!!!!!!Inside Authorise Account Access Function !!!!")
    console.log("Account fetched from Account Service ::: ", account)
    if (!account) throw new Error("Account not found")
    return account
}

const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    inboxStatus: true
})

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    sentStatus: true
})

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    accountId,
    draftStatus: true
})

export const mailRouter = createTRPCRouter({

    getAccounts: protectedProcedure.query(async ({ ctx }) => {
        // return await ctx.db.account.findMany({
        //     where: {
        //         userId: ctx.auth.userId,
        //     }, select: {
        //         id: true, emailAddress: true, name: true
        //     }
        // })
                try {
            const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/accounts`,
                {
                    params: {
                        "user_id": ctx.auth.userId
                    }
                }
            )
            console.log("GET ACCOUNTS ROUTER .... Accounts fetched from Account Service ::: ", data)
            return data
        } catch (error) {
            console.error('Error fetching accounts from FastAPI:', error)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch accounts'
            })
        }
    }),

    getNumThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string()
    })).query(async ({ ctx, input }) => {
        // const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        // let filter: Prisma.ThreadWhereInput = {}
        // if (input.tab === "inbox") {
        //     filter = inboxFilter(account.id)
        // } else if (input.tab === "sent") {
        //     filter = sentFilter(account.id)
        // } else if (input.tab === "drafts") {
        //     filter = draftFilter(account.id)
        // }
        // return await ctx.db.thread.count({
        //     where: filter
        // })
        console.log("Inside Get No Of Threads !!!!")
        console.log("Account ID :::: ", input.accountId)
        console.log("Account ID :::: ", ctx.auth.userId)
        console.log("\n\n\n")
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        try {
            const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/num-threads`,
                {
                    params: {
                        "accountId": input.accountId,
                        "tab": input.tab
                    }
                }
            )
            console.log("Thread Count fetched from Account Service ::: ", data) 
            return data.count
        } catch (error) {
            console.error('Error fetching thread count:', error)
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to fetch thread count'
            })
        }
    }),

    getThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean()
    })).query(async ({ ctx, input }) => {
        // const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        // let filter: Prisma.ThreadWhereInput = {}
        // if (input.tab === "inbox") {
        //     filter = inboxFilter(account.id)
        // } else if (input.tab === "sent") {
        //     filter = sentFilter(account.id)
        // } else if (input.tab === "drafts") {
        //     filter = draftFilter(account.id)
        // }

        // filter.done = {
        //     equals: input.done
        // }

        // const threads = await ctx.db.thread.findMany({
        //     where: filter,
        //     include: {
        //         emails: {
        //             orderBy: {
        //                 sentAt: "asc"
        //             },
        //             select: {
        //                 from: true,
        //                 body: true,
        //                 bodySnippet: true,
        //                 emailLabel: true,
        //                 subject: true,
        //                 sysLabels: true,
        //                 id: true,
        //                 sentAt: true
        //             }
        //         }
        //     },
        //     take: 15,
        //     orderBy: {
        //         lastMessageDate: "desc"
        //     }
        // })
        // return threads
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/threads`,
                {
                    params: {
                        "accountId": input.accountId,
                        "tab": input.tab,
                        "done": input.done
                    }
                }
            )
        console.log("Thread Data fetched from Account Service ::: ", data) 
        return data.threads
    }),

    getThreadById: protectedProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await ctx.db.thread.findUnique({
            where: { id: input.threadId },
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        body: true,
                        subject: true,
                        bodySnippet: true,
                        emailLabel: true,
                        sysLabels: true,
                        id: true,
                        sentAt: true
                    }
                }
            },
        })
    }),

    getReplyDetails: protectedProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(['reply', 'replyAll']) //need to change this
    })).query(async ({ ctx, input }) => {
        // const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        // const thread = await ctx.db.thread.findUnique({
        //     where: { id: input.threadId },
        //     include: {
        //         emails: {
        //             orderBy: { sentAt: 'asc' },
        //             select: {
        //                 from: true,
        //                 to: true,
        //                 cc: true,
        //                 bcc: true,
        //                 sentAt: true,
        //                 subject: true,
        //                 internetMessageId: true,
        //             },
        //         },
        //     },
        // });

        // if (!thread || thread.emails.length === 0) {
        //     throw new Error("Thread not found or empty");
        // }

        // const lastExternalEmail = thread.emails
        //     .reverse()
        //     .find(email => email.from.id !== account.id);

        // if (!lastExternalEmail) {
        //     throw new Error("No external email found in thread");
        // }

        // const allRecipients = new Set([
        //     ...thread.emails.flatMap(e => [e.from, ...e.to, ...e.cc]),
        // ]);

        // if (input.replyType === 'reply') {
        //     return {
        //         to: [lastExternalEmail.from],
        //         cc: [],
        //         from: { name: account.name, address: account.emailAddress },
        //         subject: `${lastExternalEmail.subject}`,
        //         id: lastExternalEmail.internetMessageId
        //     };
        // } else if (input.replyType === 'replyAll') {
        //     return {
        //         to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(addr => addr.id !== account.id)],
        //         cc: lastExternalEmail.cc.filter(addr => addr.id !== account.id),
        //         from: { name: account.name, address: account.emailAddress },
        //         subject: `${lastExternalEmail.subject}`,
        //         id: lastExternalEmail.internetMessageId
        //     };
        // }

        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/reply-details`,
                {
                    params: {
                       "accountId": input.accountId,
                        "threadId": input.threadId
                    }
                }
            )
        console.log("fetched Reply Details from Account Service ::: ", data) 
        return data.replyDetails
    }),

    syncEmails: protectedProcedure.input(z.object({
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        if (!account) throw new Error("Invalid token")
        const acc = new Account(account.accessToken)
        acc.syncEmails()
    }),

    setUndone: protectedProcedure.input(z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        if (!account) throw new Error("Invalid token")
        if (input.threadId) {
            await ctx.db.thread.update({
                where: {
                    id: input.threadId
                },
                data: {
                    done: false
                }
            })
        }
        if (input.threadIds) {
            await ctx.db.thread.updateMany({
                where: {
                    id: {
                        in: input.threadIds
                    }
                },
                data: {
                    done: false
                }
            })
        }
    }),

    setDone: protectedProcedure.input(z.object({
        threadId: z.string().optional(),
        threadIds: z.array(z.string()).optional(),
        accountId: z.string()
    })).mutation(async ({ ctx, input }) => {
        if (!input.threadId && !input.threadIds) throw new Error("No threadId or threadIds provided")
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        if (!account) throw new Error("Invalid token")
        if (input.threadId) {
            await ctx.db.thread.update({
                where: {
                    id: input.threadId
                },
                data: {
                    done: true
                }
            })
        }
        if (input.threadIds) {
            await ctx.db.thread.updateMany({
                where: {
                    id: {
                        in: input.threadIds
                    }
                },
                data: {
                    done: true
                }
            })
        }
    }),

    getEmailDetails: protectedProcedure.input(z.object({
        emailId: z.string(),
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return await getEmailDetails(account.accessToken, input.emailId)
    }),

    sendEmail: protectedProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(emailAddressSchema),
        cc: z.array(emailAddressSchema).optional(),
        bcc: z.array(emailAddressSchema).optional(),
        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        // const acc = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        // const account = new Account(acc.accessToken)
        // console.log('sendmail', input)
        // await account.sendEmail({
        //     body: input.body,
        //     subject: input.subject,
        //     threadId: input.threadId,
        //     to: input.to,
        //     bcc: input.bcc,
        //     cc: input.cc,
        //     replyTo: input.replyTo,
        //     from: input.from,
        //     inReplyTo: input.inReplyTo,
        // })

            const { data } = await axios.post(
            `${process.env.ACCOUNT_SERVICE_URL}/account/send-email`,
            {
                accountId: input.accountId,
                body: input.body,
                subject: input.subject,
                fromEmailAddress: input.from,
                bcc: input.bcc,
                cc: input.cc,
                to: input.to,
                replyTo: input.replyTo,
                inReplyTo: input.inReplyTo,
                threadId: input.threadId,
            }
        )
        console.log('In account file')
        console.log("Email sent response from Account Service ::: ", data) 
        return {"status": "success", "message": "Email sent successfully"}

    }),

    getEmailSuggestions: protectedProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).query(async ({ ctx, input }) => {
        // const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        // return await ctx.db.emailAddress.findMany({
        //     where: {
        //         accountId: input.accountId,
        //         OR: [
        //             {
        //                 address: {
        //                     contains: input.query,
        //                     mode: 'insensitive',
        //                 },
        //             },
        //             {
        //                 name: {
        //                     contains: input.query,
        //                     mode: 'insensitive',
        //                 },
        //             },
        //         ],
        //     },
        //     select: {
        //         address: true,
        //         name: true,
        //     },
        //     take: 10,
        // })

        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)

        const { data } = await axios.get(
                `${process.env.ACCOUNT_SERVICE_URL}/account/suggestions`,
                {
                    params: {
                       "accountId": input.accountId,
                    }
                }
            )
        console.log("Mail Addresses Suggestions fetched from Account Service ::: ", data) 
        return data.suggestions
    }),
    
    getMyAccount: protectedProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId)
        return account
    }),
});