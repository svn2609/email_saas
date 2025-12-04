import React from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/theme-toggle"
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

const LandingPage = async () => {
    const { userId } = auth()
    if (userId) {
        return redirect('/mail')
    }
    return (
        <>
            {/* <div className="h-screen w-full bg-white absolute inset-0">
            </div> */}
            <div className="absolute z-[-1] bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_80%)]">
            </div>
            <div className="min-h-screen flex flex-col items-center pt-56 relative z-[10]">
                <h1 className="bg-gradient-to-r text-center from-gray-600 font-bold text-6xl to-gray-900 inline-block text-transparent bg-clip-text">
                    The AI-powered email client
                </h1>
                <div className="h-4"></div>
                <p className="text-xl mb-8 text-gray-600 max-w-xl text-center">
                    Aadit Fadia | Jay Doshi | Kathan Gabani | Shubham Naik
                </p>
                <div className="space-x-4">
                    <Button>
                        <Link href="/mail">Get Started</Link>
                    </Button>
                </div>
                <div className="flex items-center space-x-4 mt-10 mb-10">
                    <Link href="/sign-in" className="text-sm hover:underline">Sign In</Link>
                    <Link href="/sign-up" className="text-sm hover:underline">Sign Up</Link>
                    <ModeToggle />
                </div>
            </div>
        </>
    )
}

export default LandingPage