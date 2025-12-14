
'use client'

import { Bell } from 'lucide-react'

export default function Header() {
    return (
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="relative flex flex-1" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        Search
                    </label>
                    {/* Placeholder for search */}
                </form>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
                        <span className="sr-only">View notifications</span>
                        <Bell className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-zinc-700" aria-hidden="true" />
                    <div className="flex items-center gap-x-4 lg:gap-x-6">
                        {/* Profile dropdown placeholder */}
                        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
