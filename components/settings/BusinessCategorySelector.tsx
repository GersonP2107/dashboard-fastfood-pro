'use client';

import { useState } from 'react';
import { BUSINESS_CATEGORIES, BusinessCategory } from '@/lib/data/business-categories';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Tag } from 'lucide-react';

interface BusinessCategorySelectorProps {
    selected: string[];
    onChange: (categories: string[]) => void;
    maxCategories?: number;
}

export default function BusinessCategorySelector({
    selected,
    onChange,
    maxCategories = 5,
}: BusinessCategorySelectorProps) {
    const [search, setSearch] = useState('');

    const filteredCategories = BUSINESS_CATEGORIES.filter(cat =>
        cat.label.toLowerCase().includes(search.toLowerCase())
    );

    const isSelected = (id: string) => selected.includes(id);
    const isMaxReached = selected.length >= maxCategories;

    const toggleCategory = (id: string) => {
        if (isSelected(id)) {
            onChange(selected.filter(s => s !== id));
        } else if (!isMaxReached) {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-primary" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Categorías del Negocio
                    </span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${isMaxReached
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400'
                    }`}>
                    {selected.length}/{maxCategories}
                </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecciona hasta {maxCategories} categorías que describan lo que ofrece tu negocio. Esto ayuda a los clientes a encontrarte más fácilmente.
            </p>

            {/* Search */}
            {BUSINESS_CATEGORIES.length > 10 && (
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar categoría..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all"
                />
            )}

            {/* Category Pills Grid */}
            <div className="flex flex-wrap gap-2">
                <AnimatePresence mode="popLayout">
                    {filteredCategories.map((cat) => {
                        const active = isSelected(cat.id);
                        const disabled = !active && isMaxReached;

                        return (
                            <motion.button
                                key={cat.id}
                                type="button"
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleCategory(cat.id)}
                                disabled={disabled}
                                className={`
                                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                                    border transition-all duration-200 cursor-pointer select-none
                                    ${active
                                        ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30 dark:bg-brand-primary/20 dark:text-orange-300 dark:border-orange-500/40 shadow-sm shadow-brand-primary/10'
                                        : disabled
                                            ? 'bg-gray-50 text-gray-300 border-gray-100 dark:bg-zinc-900 dark:text-zinc-600 dark:border-zinc-800 cursor-not-allowed'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-primary/50 hover:bg-brand-primary/5 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:border-orange-500/40 dark:hover:bg-brand-primary/10'
                                    }
                                `}
                            >
                                <span className="text-base leading-none">{cat.emoji}</span>
                                <span>{cat.label}</span>
                                {active && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="ml-0.5"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                    </motion.span>
                                )}
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Selected Summary */}
            {selected.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-3 border-t border-gray-100 dark:border-zinc-800"
                >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Seleccionadas:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selected.map(id => {
                            const cat = BUSINESS_CATEGORIES.find(c => c.id === id);
                            if (!cat) return null;
                            return (
                                <span
                                    key={id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary text-xs font-medium dark:bg-brand-primary/20 dark:text-orange-300"
                                >
                                    {cat.emoji} {cat.label}
                                </span>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
