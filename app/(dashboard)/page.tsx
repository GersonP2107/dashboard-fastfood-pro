'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardStats, DashboardOrder, SalesTrendPoint, TopProduct } from '@/lib/types'
import { DollarSign, ShoppingCart, TrendingUp, CheckCircle, Clock, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getDashboardStats, getSalesTrend, getTopProducts } from '@/lib/actions/analytics'
import { motion } from 'framer-motion'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import TopProductsList from '@/components/dashboard/TopProductsList'

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
  const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const business = await getCurrentBusinessman();
      if (!business) return;

      // Parallel data fetching using Server Actions
      const [
        dashboardStats,
        trendData,
        topProductsData,
        { data: recent }
      ] = await Promise.all([
        getDashboardStats(business.id),
        getSalesTrend(business.id),
        getTopProducts(business.id),
        // Keep simple query for recent orders or move to action if needed. 
        // For consistency/speed let's use the local query for now as it wasn't the main focus, 
        // but ideally should be an action. Use DB query for simplicity here.
        supabase
          .from('orders')
          .select('*')
          .eq('businessman_id', business.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      setStats(dashboardStats);
      setSalesTrend(trendData);
      setTopProducts(topProductsData);
      setRecentOrders((recent as DashboardOrder[]) || []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resumen</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Resumen de tu negocio en tiempo real
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <motion.div
            key={stat.name}
            variants={itemVariants}
            className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 shadow hover:shadow-md transition-shadow"
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
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2/3 width) */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ventas: Últimos 7 días</h2>
          <SalesTrendChart data={salesTrend} />
        </motion.div>

        {/* Top Products (1/3 width) */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Productos (Mes)</h2>
          <TopProductsList products={topProducts} />
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-zinc-900 shadow rounded-lg"
      >
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
                      {order.customer_name} • {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
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
      </motion.div>
    </motion.div>
  )
}
