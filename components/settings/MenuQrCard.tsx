"use client";

import { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { Businessman } from "@/lib/types";
import {
    QrCode,
    Download,
    Printer,
    Copy,
    Check,
    ExternalLink,
    Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MenuQrCardProps {
    businessman: Businessman;
}

const BASE_URL = "https://foodfastpro.com";

export default function MenuQrCard({ businessman }: MenuQrCardProps) {
    const [copied, setCopied] = useState(false);
    const menuUrl = `${BASE_URL}/${businessman.slug}`;

    // ── Download QR as PNG ────────────────────────────────────────
    const downloadQr = () => {
        const svg = document.getElementById("menu-qr-svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            // Add padding around the QR
            const padding = 24;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2;
            if (ctx) {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, padding, padding);
            }
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-Menu-${businessman.slug}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            toast.success("QR descargado correctamente");
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    // ── Print QR ─────────────────────────────────────────────────
    const printQr = () => {
        const printContent = document.getElementById("menu-qr-print-area");
        if (!printContent) return;

        const printWindow = window.open("about:blank", "PrintQR", "left=50000,top=50000,width=0,height=0");
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Menú QR – ${businessman.business_name}</title>
                        <style>
                            body {
                                font-family: sans-serif;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                background: #fff;
                            }
                            .qr-container {
                                text-align: center;
                                padding: 32px;
                                border: 2px solid #f97316;
                                border-radius: 16px;
                            }
                            .brand { font-size: 22px; font-weight: 800; color: #f97316; margin-bottom: 4px; }
                            .subtitle { font-size: 14px; color: #78716c; margin-bottom: 20px; }
                            .url { font-size: 11px; color: #a8a29e; margin-top: 12px; word-break: break-all; }
                        </style>
                    </head>
                    <body>
                        <div class="qr-container">
                            ${printContent.innerHTML}
                        </div>
                        <script>
                            setTimeout(() => { window.print(); window.close(); }, 500);
                        <\/script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // ── Copy URL ──────────────────────────────────────────────────
    const copyUrl = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            setCopied(true);
            toast.success("Enlace copiado al portapapeles");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("No se pudo copiar el enlace");
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">

            {/* ── QR Preview Card ───────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 flex-shrink-0"
            >
                {/* QR con borde decorativo naranja */}
                <div
                    id="menu-qr-print-area"
                    className="relative bg-white p-5 rounded-2xl border-2 border-brand-primary/20 shadow-sm"
                >
                    {/* Esquinas decorativas */}
                    <span className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-brand-primary rounded-tl-sm" />
                    <span className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-brand-primary rounded-tr-sm" />
                    <span className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-brand-primary rounded-bl-sm" />
                    <span className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-brand-primary rounded-br-sm" />

                    {/* Contenido de impresión (visible solo al imprimir) */}
                    <div className="hidden print:block text-center mb-3">
                        <p className="brand">{businessman.business_name}</p>
                        <p className="subtitle">Escanea para ver nuestro menú</p>
                    </div>

                    <QRCode
                        id="menu-qr-svg"
                        value={menuUrl}
                        size={180}
                        level="H"
                        fgColor="#1c1917"
                    />

                    {/* URL de impresión */}
                    <p className="hidden print:block url mt-2">{menuUrl}</p>
                </div>

                {/* Badge de URL */}
                <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-primary-hover font-medium transition-colors"
                >
                    <Globe className="h-3.5 w-3.5" />
                    {menuUrl.replace("https://", "")}
                    <ExternalLink className="h-3 w-3" />
                </a>
            </motion.div>

            {/* ── Info + Actions ────────────────────────────────── */}
            <div className="flex-1 space-y-4">
                {/* Descripción */}
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        QR del Menú Digital
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Comparte este código QR para que tus clientes accedan
                        directamente a la carta completa de{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                            {businessman.business_name}
                        </span>{" "}
                        desde cualquier dispositivo.
                    </p>
                </div>

                {/* Casos de uso */}
                <div className="flex flex-col gap-2">
                    {[
                        { icon: "🖨️", label: "Imprímelo", desc: "Colócalo en la entrada o en las mesas" },
                        { icon: "📱", label: "Compártelo", desc: "Envíalo por redes sociales o WhatsApp" },
                        { icon: "📋", label: "Menú físico", desc: "Úsalo como acceso rápido al menú digital" },
                    ].map(({ icon, label, desc }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                        >
                            <span className="text-xl shrink-0 leading-none">{icon}</span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{label}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Botones de acción */}
                <div className="flex flex-wrap gap-2 pt-1">
                    {/* Copiar enlace */}
                    <button
                        onClick={copyUrl}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm font-medium transition-all"
                    >
                        {copied ? (
                            <><Check className="h-4 w-4 text-green-500" /> Copiado</>
                        ) : (
                            <><Copy className="h-4 w-4" /> Copiar enlace</>
                        )}
                    </button>

                    {/* Descargar PNG */}
                    <button
                        onClick={downloadQr}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800 text-sm font-medium transition-all"
                    >
                        <Download className="h-4 w-4" /> Descargar PNG
                    </button>

                    {/* Imprimir */}
                    <button
                        onClick={printQr}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-hover text-sm font-medium transition-all shadow-sm shadow-brand-primary/20"
                    >
                        <Printer className="h-4 w-4" /> Imprimir
                    </button>
                </div>

                {/* Info técnica */}
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1">
                    <QrCode className="size-10" />
                    Nivel de corrección H · Formato SVG/PNG · Actualizable sin cambiar el QR
                </p>
            </div>
        </div>
    );
}
