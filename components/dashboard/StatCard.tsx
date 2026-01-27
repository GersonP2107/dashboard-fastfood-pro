import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        positive?: boolean;
    };
    className?: string;
    iconColor?: string;
    description?: string;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    className,
    iconColor = "text-brand-primary dark:text-brand-light bg-orange-50 dark:bg-orange-900/20",
    description
}: StatCardProps) {
    return (
        <div className={cn(
            "relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 transition-all hover:shadow-lg",
            className
        )}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {value}
                    </h3>
                    {description && (
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
                <div className={cn("p-2 rounded-2xl bg-gray-50 dark:bg-zinc-800", iconColor)}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span className={cn(
                        "font-medium",
                        trend.positive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {trend.positive ? "+" : ""}{trend.value}%
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                        {trend.label}
                    </span>
                </div>
            )}
        </div>
    );
}
