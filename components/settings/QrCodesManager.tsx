"use client";

import { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { Businessman, Zone, RestaurantTable } from "@/lib/types";
import { QrCode, Download, Printer, X, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QrCodesManagerProps {
    businessman: Businessman;
    zones: Zone[];
}

export default function QrCodesManager({ businessman, zones }: QrCodesManagerProps) {
    const [selectedTable, setSelectedTable] = useState<{ table: RestaurantTable; zone: Zone } | null>(null);

    const getQrUrl = (zoneName: string, tableName: string) => {
        // Construct the URL: https://[domain]/[slug]/pos?table=[table]&zone=[zone]
        // We use window.location.origin to get the current domain
        if (typeof window === 'undefined') return '';

        const baseUrl = "https://foodfastpro.com";
        const slug = businessman.slug;
        const encodedZone = encodeURIComponent(zoneName);
        const encodedTable = encodeURIComponent(tableName);

        return `${baseUrl}/${slug}/pos?table=${encodedTable}&zone=${encodedZone}`;
    };

    const downloadQr = (zoneName: string, tableName: string) => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-${zoneName}-${tableName}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    const printQr = () => {
        const printContent = document.getElementById("qr-print-area");
        if (!printContent) return;

        const windowUrl = 'about:blank';
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir QR</title>
                        <style>
                            body {
                                font-family: sans-serif;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .qr-container {
                                text-align: center;
                                padding: 20px;
                                border: 1px solid #ccc;
                                border-radius: 10px;
                            }
                            h1 { font-size: 24px; margin-bottom: 5px; }
                            h2 { font-size: 18px; color: #666; margin-top: 0; margin-bottom: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            ${printContent.innerHTML}
                        </div>
                        <script>
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-6">
            <AnimatePresence>
                {selectedTable && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedTable(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Código QR</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {selectedTable.zone.name} - {selectedTable.table.name}
                                </p>
                            </div>

                            <div className="flex justify-center mb-6 bg-white p-4 rounded-xl border border-gray-100" id="qr-print-area">
                                <div className="text-center">
                                    {/* Print Title (Hidden in view, visible in print) */}
                                    <div className="hidden print:block mb-2">
                                        <h1 className="text-xl font-bold">{businessman.business_name}</h1>
                                        <h2>{selectedTable.zone.name} - {selectedTable.table.name}</h2>
                                    </div>

                                    <QRCode
                                        id="qr-code-svg"
                                        value={getQrUrl(selectedTable.zone.name, selectedTable.table.name)}
                                        size={200}
                                        level="H"
                                    />

                                    <p className="mt-2 text-xs text-gray-400 break-all max-w-[200px] mx-auto hidden">
                                        {getQrUrl(selectedTable.zone.name, selectedTable.table.name)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => downloadQr(selectedTable.zone.name, selectedTable.table.name)}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar
                                </button>
                                <button
                                    onClick={printQr}
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors text-sm font-medium"
                                >
                                    <Printer className="h-4 w-4" />
                                    Imprimir
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-6">
                {zones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No hay zonas creadas. Crea zonas y mesas primero.
                    </div>
                ) : (
                    zones.map((zone) => (
                        <div key={zone.id} className="border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <div className="bg-gray-50/50 dark:bg-zinc-800/50 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
                                    {zone.name}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {zone.tables?.length || 0} mesas
                                </span>
                            </div>

                            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {zone.tables && zone.tables.length > 0 ? (
                                    zone.tables.map((table) => (
                                        <button
                                            key={table.id}
                                            onClick={() => setSelectedTable({ table, zone })}
                                            className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-brand-primary dark:hover:border-brand-primary hover:shadow-md transition-all bg-white dark:bg-zinc-900 group"
                                        >
                                            <QrCode className="h-8 w-8 text-gray-400 group-hover:text-brand-primary mb-2 transition-colors" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-brand-primary truncate w-full text-center">
                                                {table.name}
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Eye className="h-3 w-3" /> Ver QR
                                            </span>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-4 text-sm text-gray-400 italic">
                                        No hay mesas en esta zona
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
