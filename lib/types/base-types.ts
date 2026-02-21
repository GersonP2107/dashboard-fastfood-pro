// ============================================================================
// Base Type Definitions (from digital-menu project)
// ============================================================================

export interface Businessman {
    id: string
    user_id?: string
    business_name: string
    slug: string
    description?: string
    logo_url?: string
    banner_url?: string
    phone?: string
    email?: string
    address?: string
    neighborhood?: string
    city?: string
    department?: string
    whatsapp_number: string
    whatsapp_api_token?: string
    is_active: boolean
    accept_orders: boolean
    opening_hours?: string
    closing_hours?: string
    delivery_surge_multiplier?: number;
    last_name_change?: string;
    operating_schedule?: OperatingScheduleItem[];
    delivery_time_estimate?: string;
    min_order_value: number;
    delivery_cost: number;
    plan_type: 'essential' | 'professional' | 'premium';
    subscription_status: 'active' | 'past_due' | 'canceled';
    subscription_end?: string;
    trial_ends_at?: string;
    business_categories?: string[];
    created_at: string
    updated_at: string
}

export interface OperatingScheduleItem {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    label: string;
    open: string;
    close: string;
    isActive: boolean;
}

export interface Category {
    id: string
    businessman_id: string
    name: string
    description: string | null
    image_url: string | null
    order: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Product {
    id: string
    businessman_id: string
    category_id: string | null
    name: string
    description: string | null
    image_url: string | null
    price: number
    discount_price: number | null
    is_available: boolean
    limited_stock: boolean
    stock_quantity: number | null
    featured: boolean
    order: number
    created_at: string
    updated_at: string
    deleted_at: string | null
    category?: Pick<Category, 'id' | 'name'> | null
    product_modifiers?: Array<Pick<ProductModifier, 'id' | 'is_required'> & { modifier: Modifier }>
}

export interface Modifier {
    id: string
    businessman_id: string
    name: string
    description: string | null
    additional_price: number
    type: 'extra' | 'without' | 'option'
    created_at: string
}

export interface ProductModifier {
    id: string
    product_id: string
    modifier_id: string
    is_required: boolean
    modifier?: Modifier
}

export interface Order {
    id: string
    businessman_id: string
    order_number: string
    customer_name: string
    customer_phone: string
    customer_email?: string
    delivery_type: 'delivery' | 'pickup'
    delivery_address?: string
    delivery_notes?: string
    payment_method: 'efectivo' | 'transferencia' | 'tarjeta'
    subtotal: number
    shipping_cost: number
    tip?: number
    discount: number
    total: number
    status: 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'en_route' | 'delivered' | 'cancelled'
    notification_sent: boolean
    notification_error?: string
    created_at: string
    updated_at: string
    order_items?: OrderItem[]
}

export interface OrderItem {
    id: string
    order_id: string
    product_id?: string
    product_name: string
    product_description?: string
    unit_price: number
    quantity: number
    subtotal: number
    created_at: string
    modifiers?: OrderItemModifier[]
}

export interface OrderItemModifier {
    id: string
    order_item_id: string
    modifier_id?: string
    modifier_name: string
    additional_price: number
    created_at: string
}

export interface DeliveryZone {
    id: string
    businessman_id: string
    zone_name: string
    delivery_cost: number
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface PaymentMethod {
    id: string
    businessman_id: string
    type: 'nequi' | 'daviplata' | 'bancolombia' | 'efectivo' | 'card' | 'other'
    name: string
    account_number?: string
    instructions?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface UserProfile {
    id: string
    full_name: string | null
    avatar_url: string | null
    phone: string | null
    updated_at: string
}
