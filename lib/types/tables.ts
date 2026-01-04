export interface Zone {
    id: string;
    businessman_id: string;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tables?: RestaurantTable[];
}

export interface RestaurantTable {
    id: string;
    zone_id: string;
    businessman_id: string;
    name: string;
    capacity: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    zone?: Zone;
}
