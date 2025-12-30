
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { getCurrentBusinessman } from '@/lib/actions/users'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const business = await getCurrentBusinessman();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black">
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <Sidebar business={business} />
            </div>

            <div className="lg:pl-64 flex flex-col flex-1">
                <Header business={business} />
                <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black">
                    {children}
                </main>
            </div>
        </div>
    )
}
