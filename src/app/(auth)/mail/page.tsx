
const MailPage = dynamic(() => import("@/app/mail/index"), {
  loading: () => <div>Loading...</div>,
  ssr: false,
})
import { ModeToggle } from "@/components/theme-toggle"
import { UserButton } from "@clerk/nextjs"
import dynamic from "next/dynamic"
import ComposeButton from "@/app/mail/components/compose-button"
export default function Home() {
  // return <AuthoriseButton />
  return <>
    <div className="absolute bottom-4 left-4">
      <div className="flex items-center gap-4">
        <UserButton />
        <ModeToggle />
        <ComposeButton />
        {process.env.NODE_ENV === 'development'}

      </div>
    </div>
    <MailPage />
  </>
}
