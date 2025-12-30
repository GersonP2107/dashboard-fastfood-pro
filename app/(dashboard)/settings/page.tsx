'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getDeliveryZones } from '@/lib/actions/settings'
import { Businessman, DeliveryZone } from '@/lib/types'
import BusinessProfileForm from '@/components/settings/BusinessProfileForm'
import DeliveryZonesManager from '@/components/settings/DeliveryZonesManager'
import { Store, Truck } from 'lucide-react'

export default function SettingsPage() {
    const [business, setBusiness] = useState<Businessman | null>(null)
    const [zones, setZones] = useState<DeliveryZone[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const businessData = await getCurrentBusinessman()
                if (businessData) {
                    setBusiness(businessData)
                    console.log("Business loaded:", businessData.id)
                    const zonesData = await getDeliveryZones(businessData.id)
                    console.log("Zones loaded in page:", zonesData)
                    setZones(zonesData)
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    if (!business) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Administra la información de tu negocio y opciones de entrega.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Store className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Perfil del Negocio</h2>
                        </div>
                        <BusinessProfileForm businessman={business} />
                    </div>
                </div>

                {/* Delivery Zones Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 h-full">
                        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Truck className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Domicilios</h2>
                        </div>
                        <DeliveryZonesManager
                            businessmanId={business.id}
                            initialZones={zones}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
