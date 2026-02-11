// Predefined business categories for the menu explorer
// Each category has a unique id (stored in DB), a display label, and an emoji icon

export interface BusinessCategory {
    id: string;
    label: string;
    emoji: string;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
    { id: 'hamburguesas', label: 'Hamburguesas', emoji: '🍔' },
    { id: 'pizza', label: 'Pizza', emoji: '🍕' },
    { id: 'comida_rapida', label: 'Comida Rápida', emoji: '🍟' },
    { id: 'pollo', label: 'Pollo', emoji: '🍗' },
    { id: 'asados', label: 'Asados', emoji: '🥩' },
    { id: 'mexicana', label: 'Mexicana', emoji: '🌮' },
    { id: 'sushi', label: 'Sushi', emoji: '🍣' },
    { id: 'postres', label: 'Postres', emoji: '🍰' },
    { id: 'bebidas', label: 'Bebidas', emoji: '🧃' },
    { id: 'panaderia', label: 'Panadería', emoji: '🥐' },
    { id: 'saludable', label: 'Saludable', emoji: '🥗' },
    { id: 'mariscos', label: 'Mariscos', emoji: '🦐' },
    { id: 'italiana', label: 'Italiana', emoji: '🍝' },
    { id: 'cafe', label: 'Café', emoji: '☕' },
    { id: 'desayunos', label: 'Desayunos', emoji: '🍳' },
    { id: 'arabe', label: 'Árabe', emoji: '🧆' },
    { id: 'china', label: 'China', emoji: '🥡' },
    { id: 'vegana', label: 'Vegana', emoji: '🌱' },
    { id: 'helados', label: 'Helados', emoji: '🍦' },
    { id: 'tipica', label: 'Típica / Casera', emoji: '🍲' },
];

// Helper to get a category by id
export function getCategoryById(id: string): BusinessCategory | undefined {
    return BUSINESS_CATEGORIES.find(cat => cat.id === id);
}

// Helper to get labels for an array of category ids
export function getCategoryLabels(ids: string[]): string[] {
    return ids
        .map(id => getCategoryById(id))
        .filter((cat): cat is BusinessCategory => cat !== undefined)
        .map(cat => `${cat.emoji} ${cat.label}`);
}
