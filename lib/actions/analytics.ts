"use server";

import { createClient } from "@/lib/supabase/server";
import { DashboardStats, SalesTrendPoint, TopProduct } from "@/lib/types/dashboard";
import { startOfMonth, subDays, format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

export async function getDashboardStats(businessmanId: string): Promise<DashboardStats> {
    const supabase = await createClient();
    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();
    const todayStart = startOfDay(now).toISOString();

    // Fetch month orders
    const { data: monthOrders, error: monthError } = await supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("businessman_id", businessmanId)
        .gte("created_at", monthStart);

    if (monthError) {
        console.error("Error fetching stats:", monthError);
        return {
            total_sales_month: 0,
            total_orders_month: 0,
            average_order_value: 0,
            acceptance_rate: 0,
            pending_orders: 0,
            today_sales: 0
        };
    }

    // Process stats
    const deliveredOrders = monthOrders.filter(o => o.status === 'entregado' || o.status === 'delivered');
    const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = deliveredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const allOrdersCount = monthOrders.length;
    const cancelledCount = monthOrders.filter(o => o.status === 'cancelado' || o.status === 'cancelled').length;
    const acceptanceRate = allOrdersCount > 0
        ? ((allOrdersCount - cancelledCount) / allOrdersCount) * 100
        : 100;

    const pendingOrders = monthOrders.filter(o => o.status === 'pendiente' || o.status === 'pending').length;

    // Today sales (from the already fetched month data if possible, or fetch separate if volume is high, but array filter is fine for MVP)
    const todaySales = monthOrders
        .filter(o => o.created_at >= todayStart && (o.status !== 'cancelado' && o.status !== 'cancelled'))
        .reduce((sum, o) => sum + o.total, 0);

    return {
        total_sales_month: totalSales,
        total_orders_month: totalOrders,
        average_order_value: avgOrderValue,
        acceptance_rate: acceptanceRate,
        pending_orders: pendingOrders,
        today_sales: todaySales
    };
}

export async function getSalesTrend(businessmanId: string): Promise<SalesTrendPoint[]> {
    const supabase = await createClient();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 6); // Include today
    const startDate = startOfDay(sevenDaysAgo).toISOString();

    const { data: orders, error } = await supabase
        .from("orders")
        .select("total, created_at, status")
        .eq("businessman_id", businessmanId)
        .gte("created_at", startDate)
        .neq("status", "cancelado")
        .neq("status", "cancelled");

    if (error) {
        console.error("Error fetching trend:", error);
        return [];
    }

    // Initialize last 7 days with 0
    const trendMap = new Map<string, SalesTrendPoint>();
    for (let i = 0; i < 7; i++) {
        const date = subDays(now, i);
        // Format: "Mon", "Tue" etc. or "DD/MM" - Let's use condensed date
        const key = format(date, "EEE d", { locale: es }); // e.g. "Lun 2"
        const isoDate = format(date, "yyyy-MM-dd");
        trendMap.set(isoDate, { date: key, sales: 0, orders: 0 });
    }

    // Aggregate
    orders.forEach(order => {
        const orderDate = format(new Date(order.created_at), "yyyy-MM-dd");
        if (trendMap.has(orderDate)) {
            const point = trendMap.get(orderDate)!;
            point.sales += order.total;
            point.orders += 1;
        }
    });

    // Convert map to array and reverse to chronological order
    const result = Array.from(trendMap.values()).reverse();
    return result;
}

export async function getTopProducts(businessmanId: string): Promise<TopProduct[]> {
    const supabase = await createClient();
    const now = new Date();
    const monthStart = startOfMonth(now).toISOString();

    // We need to join orders -> order_items
    // But supabase join query returns nested.
    const { data, error } = await supabase
        .from("order_items")
        .select(`
            *,
            order:orders!inner(status, created_at)
        `)
        .eq("order.businessman_id", businessmanId)
        .gte("order.created_at", monthStart)
        .neq("order.status", "cancelado");

    if (error) {
        console.error("Error fetching top products:", error);
        return [];
    }

    const productMap = new Map<string, TopProduct>();

    data.forEach((item: any) => {
        // Warning: item.product_id might be null if manually added? Assuming mostly standard products
        const id = item.product_id || "unknown";
        const name = item.product_name;

        if (!productMap.has(id)) {
            productMap.set(id, {
                product_id: id,
                product_name: name,
                total_quantity: 0,
                total_revenue: 0,
                order_count: 0
            });
        }

        const product = productMap.get(id)!;
        product.total_quantity += item.quantity;
        product.total_revenue += item.subtotal;
        product.order_count += 1;
    });

    // Sort by quantity desc (or revenue?) - "Mas vendidos" usually means quantity
    return Array.from(productMap.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 5);
}
