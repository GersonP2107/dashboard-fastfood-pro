'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCurrentBusinessman } from '@/lib/actions/users'
import { getZones } from '@/lib/actions/tables'
import { getDeliveryZones } from '@/lib/actions/settings'
import { getPaymentMethods } from '@/lib/actions/payment-methods'
import { Zone, Businessman, DeliveryZone, PaymentMethod } from '@/lib/types'
import TableManager from '@/components/settings/TableManager'
import BusinessProfileForm from '@/components/settings/BusinessProfileForm'
import DeliveryZonesManager from '@/components/settings/DeliveryZonesManager'
import PaymentMethodsManager from '@/components/settings/PaymentMethodsManager'
import QrCodesManager from '@/components/settings/QrCodesManager'
import MenuQrCard from '@/components/settings/MenuQrCard'
import { Store, Truck, Layout, QrCode, Globe } from 'lucide-react'

export default function SettingsPage() {
    const [business, setBusiness] = useState<Businessman | null>(null)
    const [zones, setZones] = useState<DeliveryZone[]>([])
    const [tableZones, setTableZones] = useState<Zone[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const businessData = await getCurrentBusinessman()
                if (businessData) {
                    setBusiness(businessData)
                    console.log("Business loaded:", businessData.id)
                    const [zonesData, tableZonesData, paymentMethodsData] = await Promise.all([
                        getDeliveryZones(businessData.id),
                        getZones(businessData.id),
                        getPaymentMethods(businessData.id)
                    ]);
                    setZones(zonesData)
                    setTableZones(tableZonesData)
                    setPaymentMethods(paymentMethodsData)
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Configuración</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Administra la información de tu negocio, mesas y opciones de entrega
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Store className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Información del Negocio</h2>
                        </div>
                        <BusinessProfileForm businessman={business} />
                    </div>

                    {/* Table Manager Section - Only for Pro/Premium */}
                    {business.plan_type !== 'essential' && (
                        <>
                            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                                <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <Layout className="h-5 w-5" />
                                    <h2 className="text-lg font-semibold">Mesas y Zonas</h2>
                                </div>
                                <TableManager
                                    businessmanId={business.id}
                                    initialZones={tableZones}
                                />
                            </div>

                            {/* QR Codes Section */}
                            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                                <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                                    <QrCode className="h-5 w-5" />
                                    <h2 className="text-lg font-semibold">Códigos QR para Mesas</h2>
                                </div>
                                <QrCodesManager
                                    businessman={business}
                                    zones={tableZones}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Right Column: Delivery & Payment */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Delivery Zones */}
                    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Truck className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">Domicilios</h2>
                        </div>
                        <DeliveryZonesManager
                            businessmanId={business.id}
                            initialZones={zones}
                            surgeMultiplier={business.delivery_surge_multiplier}
                        />
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                        <PaymentMethodsManager
                            businessmanId={business.id}
                            initialMethods={paymentMethods}
                        />
                    </div>

                    {/* Menu QR Code – available for ALL plans */}
                    <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-gray-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center gap-2 mb-6 text-brand-primary dark:text-brand-light border-b border-gray-100 dark:border-gray-800 pb-4">
                            <Globe className="h-5 w-5" />
                            <h2 className="text-lg font-semibold">QR del Menú</h2>
                        </div>
                        <MenuQrCard businessman={business} />
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
