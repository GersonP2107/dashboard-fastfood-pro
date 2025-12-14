'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardStats, DashboardOrder } from '@/lib/types'
import { DollarSign, ShoppingCart, TrendingUp, CheckCircle, Clock, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    total_sales_month: 0,
    total_orders_month: 0,
    average_order_value: 0,
    acceptance_rate: 0,
    pending_orders: 0,
    today_sales: 0,
  })
  const [recentOrders, setRecentOrders] = useState<DashboardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get current month start
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      // Fetch orders for the month
      const { data: monthOrders, error: monthError } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .gte('created_at', monthStart)

      if (monthError) throw monthError

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', todayStart)
        .neq('status', 'cancelado')

      if (todayError) throw todayError

      // Fetch recent orders
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentError) throw recentError

      // Calculate stats
      const deliveredOrders = monthOrders?.filter((o) => o.status === 'entregado') || []
      const totalSales = deliveredOrders.reduce((sum, o) => sum + o.total, 0)
      const totalOrders = deliveredOrders.length
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

      const totalOrdersIncludingCancelled = monthOrders?.length || 0
      const cancelledOrders = monthOrders?.filter((o) => o.status === 'cancelado').length || 0
      const acceptanceRate =
        totalOrdersIncludingCancelled > 0
          ? ((totalOrdersIncludingCancelled - cancelledOrders) / totalOrdersIncludingCancelled) * 100
          : 100

      const pendingCount = monthOrders?.filter((o) => o.status === 'pendiente').length || 0
      const todaySales = todayOrders?.reduce((sum, o) => sum + o.total, 0) || 0

      setStats({
        total_sales_month: totalSales,
        total_orders_month: totalOrders,
        average_order_value: avgOrderValue,
        acceptance_rate: acceptanceRate,
        pending_orders: pendingCount,
        today_sales: todaySales,
      })

      setRecentOrders(recent || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      name: 'Ventas del Mes',
      value: `$${stats.total_sales_month.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Pedidos del Mes',
      value: stats.total_orders_month,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      name: 'Ticket Promedio',
      value: `$${Math.round(stats.average_order_value).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Tasa de Aceptación',
      value: `${Math.round(stats.acceptance_rate)}%`,
      icon: CheckCircle,
      color: 'bg-indigo-500',
    },
    {
      name: 'Pedidos Pendientes',
      value: stats.pending_orders,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      name: 'Ventas de Hoy',
      value: `$${stats.today_sales.toLocaleString()}`,
      icon: Package,
      color: 'bg-pink-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Resumen de tu negocio en tiempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.name}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-zinc-900 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pedidos Recientes</h2>
          <Link
            href="/orders"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No hay pedidos recientes
            </div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                href="/orders"
                className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        #{order.order_number}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : order.status === 'entregado'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {order.client_name} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${order.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
