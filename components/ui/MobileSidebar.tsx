"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import { Businessman } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    business: Businessman | null;
}

export default function MobileSidebar({ isOpen, onClose, business }: MobileSidebarProps) {
    // Close on route change (could be improved by listenning to pathname, but Sidebar links usually cause full reload in Next.js app router if using <a>, if using <Link> verify behavior. 
    // Assuming Sidebar uses <Link>, we might want to autoclose. For now simple toggle.)

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
                    />

                    {/* Sidebar Container */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-zinc-900 shadow-2xl lg:hidden flex flex-col border-r border-gray-100 dark:border-zinc-800"
                    >
                        {/* Reusing existing Sidebar component but ensuring it takes full height */}
                        <div className="h-full overflow-y-auto">
                            <Sidebar business={business} onCloseMobile={onClose} />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
