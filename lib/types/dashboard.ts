// ============================================================================
// Dashboard TypeScript Type Definitions
// ============================================================================

import { OrderItem } from '@/lib/types/base-types'

// Business Settings
export interface BusinessSettings {
    id: string
    businessman_id: string
    is_open: boolean
    opening_hours: {
        [key: string]: {
            open: string
            close: string
        }
    }
    auto_accept_orders: boolean
    order_notification_sound: boolean
    created_at: string
    updated_at: string
}

// Order Status History
export interface OrderStatusHistory {
    id: string
    order_id: string
    status: string
    changed_by?: string
    notes?: string
    created_at: string
}

// Extended Order with relations for dashboard
export interface DashboardOrder {
    id: string
    businessman_id: string
    order_number: string
    customer_name: string
    customer_phone: string
    customer_email?: string
    delivery_type: 'delivery' | 'pickup' | 'dine_in'
    delivery_address?: string
    delivery_notes?: string
    payment_method: 'efectivo' | 'transferencia' | 'tarjeta'
    subtotal: number
    shipping_cost: number
    tip?: number
    discount: number
    total: number
    status: OrderStatus
    notification_sent: boolean
    notification_error?: string
    created_at: string
    updated_at: string
    // Relations
    order_items?: OrderItem[]
    status_history?: OrderStatusHistory[]
    elapsed_time?: number // calculated field in minutes
    // Table Info
    restaurant_tables?: {
        label: string
        restaurant_zones?: {
            name: string
        }
    }
}

// Dashboard Statistics
export interface DashboardStats {
    total_sales_month: number
    total_orders_month: number
    average_order_value: number
    acceptance_rate: number
    pending_orders: number
    today_sales: number
}

// Top Product Report
export interface TopProduct {
    product_id: string
    product_name: string
    total_quantity: number
    total_revenue: number
    order_count: number
}

// Sales Trend Data Point
export interface SalesTrendPoint {
    date: string
    sales: number
    orders: number
}

// Order Filter Options
export type OrderStatus = 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'en_route' | 'delivered' | 'cancelled'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta'

export interface OrderFilters {
    status?: OrderStatus
    payment_method?: PaymentMethod
    date_from?: string
    date_to?: string
    search?: string
}

// Product Form Data
export interface ProductFormData {
    name: string
    description?: string
    category_id?: string
    price: number
    discount_price?: number
    image_url?: string
    is_available: boolean
    featured: boolean
    order: number
    modifier_ids?: string[]
}

// Category Form Data
export interface CategoryFormData {
    name: string
    description?: string
    image_url?: string
    order: number
    is_active: boolean
}
