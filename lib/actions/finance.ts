'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'

export type DateRange = 'today' | 'week' | 'month' | 'last7days'

export async function getFinancialStats(businessmanId: string, range: DateRange = 'today') {
    const supabase = await createClient()
    const now = new Date()

    let startDate: Date
    let endDate: Date = endOfDay(now)

    switch (range) {
        case 'today':
            startDate = startOfDay(now)
            break
        case 'week':
            startDate = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
            break
        case 'month':
            startDate = startOfMonth(now)
            break
        case 'last7days':
            startDate = startOfDay(subDays(now, 6))
            break
        default:
            startDate = startOfDay(now)
    }

    // 1. Fetch completed orders in range with items for top products
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('businessman_id', businessmanId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['entregado', 'delivered', 'listo', 'ready'])

    if (error) {
        console.error('Error fetching finance stats:', error)
        return null
    }

    // 2. Calculate KPIs
    const totalSales = orders.reduce((acc, order) => acc + order.total, 0)
    const orderCount = orders.length
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0

    // 3. Sales by Payment Method
    const salesByMethod = orders.reduce((acc, order) => {
        const method = order.payment_method || 'unknown'
        acc[method] = (acc[method] || 0) + order.total
        return acc
    }, {} as Record<string, number>)

    const paymentMethodData = Object.entries(salesByMethod).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
    }))

    // 4. Sales by Delivery Type
    const salesByType = orders.reduce((acc, order) => {
        const type = order.delivery_type || 'unknown'
        acc[type] = (acc[type] || 0) + order.total
        return acc
    }, {} as Record<string, number>)

    const salesByTypeData = Object.entries(salesByType).map(([name, value]) => ({
        name: name === 'delivery' ? 'Domicilio' : name === 'pickup' ? 'Recoger' : name === 'dine_in' ? 'Mesa' : name,
        value
    }))

    // 5. Top Products
    const productStats = orders.flatMap(o => o.order_items || []).reduce((acc, item) => {
        const name = item.product_name
        if (!acc[name]) {
            acc[name] = { name, quantity: 0, revenue: 0 }
        }
        acc[name].quantity += item.quantity
        acc[name].revenue += item.subtotal // Approximately, ignoring order-level discounts for item simplicity
        return acc
    }, {} as Record<string, { name: string, quantity: number, revenue: number }>)

    const topProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

    // 6. Sales Over Time (Chart Data)
    // Initialize all days/hours with 0 to have a continuous line
    let salesOverTime: { date: string; total: number; count: number }[] = []

    if (range === 'today') {
        // Hourly breakdown
        const hours = Array.from({ length: 24 }, (_, i) => i)
        salesOverTime = hours.map(hour => {
            const hourOrders = orders.filter(o => new Date(o.created_at).getHours() === hour)
            return {
                date: `${hour}:00`,
                total: hourOrders.reduce((a, b) => a + b.total, 0),
                count: hourOrders.length
            }
        })
    } else {
        // Daily breakdown
        const days = eachDayOfInterval({ start: startDate, end: endDate })
        salesOverTime = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const dayOrders = orders.filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === dayStr)
            return {
                date: format(day, 'EEE d', { locale: es }), // Lun 6
                total: dayOrders.reduce((a: number, b: any) => a + b.total, 0),
                count: dayOrders.length
            }
        })
    }

    return {
        totalSales,
        orderCount,
        averageTicket,
        paymentMethodData,
        salesByTypeData,
        topProducts,
        salesOverTime,
        rawOrders: orders // For CSV export
    }
}
