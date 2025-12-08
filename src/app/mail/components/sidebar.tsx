'use client'
import React from 'react'
import { Nav } from './nav'

import {
    AlertCircle,
    Archive,
    ArchiveX,
    File,
    Inbox,
    MessagesSquare,
    Send,
    ShoppingCart,
    Trash2,
    Users2,
} from "lucide-react"
import { usePathname } from 'next/navigation'
import { useLocalStorage } from 'usehooks-ts'
import { api } from '@/trpc/react'
type Props = { isCollapsed: boolean }

const SideBar = ({ isCollapsed }: Props) => {

    const [accountId] = useLocalStorage("accountId", '')
    const [tab, setTab] = useLocalStorage<'inbox' | 'draft' | 'sent'>(
        "normalhuman-tab",
        "inbox"
      )      
    const refetchInterval = 5000

    const { data: inboxThreads } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "inbox"
    }, { enabled: !!accountId && !!tab, refetchInterval })

    const { data: draftsThreads } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "draft"
    }, { enabled: !!accountId && !!tab, refetchInterval })

    const { data: sentThreads } = api.mail.getNumThreads.useQuery({
        accountId,
        tab: "sent"
    }, { enabled: !!accountId && !!tab, refetchInterval })

    return (
        <>
            <Nav
                isCollapsed={isCollapsed}
                links={[
                    {
                        title: "Inbox",
                        value: "inbox",
                        label: inboxThreads?.toString() || "0",
                        icon: Inbox,
                        variant: tab === "inbox" ? "default" : "ghost",
                    },
                    {
                        title: "Drafts",
                        value: "draft",
                        label: draftsThreads?.toString() || "0",
                        icon: File,
                        variant: tab === "draft" ? "default" : "ghost",
                    },
                    {
                        title: "Sent",
                        value: "sent",
                        label: sentThreads?.toString() || "0",
                        icon: Send,
                        variant: tab === "sent" ? "default" : "ghost",
                    },
                ]}
            />
        </>
    )
}

export default SideBar