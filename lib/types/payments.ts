export interface Plan {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    duration_days: number;
    plan_type: 'essential' | 'professional' | 'premium';
    is_active: boolean;
    created_at: string;
}

export interface Payment {
    id: string;
    businessman_id: string;
    plan_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected' | 'voided';
    bold_order_id: string;
    bold_tx_id?: string;
    created_at: string;
    updated_at: string;
}
