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
import StatCard from '@/components/dashboard/StatCard'

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



  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
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
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Panel Principal</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Resumen de actividad en tiempo real
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Primary Stat: Total Sales Month */}
        <StatCard
          title="Ventas del Mes"
          value={`$${stats.total_sales_month.toLocaleString()}`}
          icon={DollarSign}
          iconColor="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
          className="md:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-900/50"
          description="Ingresos acumulados este mes"
        />

        {/* Secondary Stats */}
        <StatCard
          title="Pedidos del Mes"
          value={stats.total_orders_month.toString()}
          icon={ShoppingCart}
          iconColor="text-brand-light dark:text-brand-light bg-orange-50 dark:bg-orange-900/20"
        />

        <StatCard
          title="Pedidos Pendientes"
          value={stats.pending_orders.toString()}
          icon={Clock}
          iconColor="text-brand-primary dark:text-brand-primary bg-orange-50 dark:bg-orange-900/20"
          description="Requieren atención inmediata"
        />

        {/* Chart Section (Spans 3 cols) */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-2 lg:col-span-3 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tendencia de Ventas</h2>
              <p className="text-sm text-gray-500">Últimos 7 días</p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-zinc-800 rounded-xl text-brand-primary dark:text-brand-light">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <SalesTrendChart data={salesTrend} />
        </motion.div>

        {/* Top Products (Vertical Column) */}
        <motion.div
          variants={itemVariants}
          className="md:col-span-1 lg:col-span-1 row-span-2 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Más Vendidos</h2>
          <TopProductsList products={topProducts} />
        </motion.div>

        {/* Tertiary Stats */}
        <StatCard
          title="Ticket Promedio"
          value={`$${Math.round(stats.average_order_value).toLocaleString()}`}
          icon={DollarSign}
          className="lg:col-start-1"
        />

        <StatCard
          title="Ventas Hoy"
          value={`$${stats.today_sales.toLocaleString()}`}
          icon={Package}
          iconColor="text-brand-accent dark:text-red-400 bg-red-50 dark:bg-red-900/20"
        />

        <StatCard
          title="Tasa Aceptación"
          value={`${Math.round(stats.acceptance_rate)}%`}
          icon={CheckCircle}
        />

      </div>

      {/* Recent Orders Section */}
      <motion.div
        variants={itemVariants}
        className="rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/20">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pedidos Recientes</h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-brand-primary dark:text-brand-light hover:text-brand-primary-hover"
          >
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No hay pedidos recientes
            </div>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                    ${order.status === 'pendiente' ? 'bg-orange-50 text-brand-primary dark:bg-orange-900/30 dark:text-orange-400' :
                      order.status === 'entregado' ? 'bg-green-100 text-brand-success dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'}`}
                  >
                    {order.customer_name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{order.customer_name}</span>
                      <span className="text-xs text-gray-400">#{order.order_number}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:justify-end">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${order.status === 'pendiente'
                      ? 'bg-orange-50 text-brand-primary border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900'
                      : order.status === 'entregado'
                        ? 'bg-green-50 text-brand-success border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900'
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-900'
                      }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white w-24 text-right">
                    ${order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div >
  )
}
