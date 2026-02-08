'use client'

import { useEffect, useRef } from 'react'

interface BoldConfig {
    apiKey: string;
    orderId: string;
    amount: number;
    currency: string;
    integritySignature: string;
    description: string;
    redirectionUrl: string;
    tax: number;
}

export default function BoldPaymentWidget({ config }: { config: BoldConfig }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Check if script is already there to prevent duplicates
        if (containerRef.current.querySelector('script')) return;

        const script = document.createElement('script');
        script.src = "https://checkout.bold.co/library/boldPaymentButton.js";

        script.setAttribute('data-bold-button', 'CONFIRM_TRANSACTION_BTN');
        script.setAttribute('data-api-key', config.apiKey);
        script.setAttribute('data-order-id', config.orderId);
        script.setAttribute('data-currency', config.currency);
        script.setAttribute('data-amount', config.amount.toString());
        script.setAttribute('data-integrity-signature', config.integritySignature);
        script.setAttribute('data-description', config.description);
        script.setAttribute('data-redirection-url', config.redirectionUrl);
        if (config.tax !== undefined) script.setAttribute('data-tax', config.tax.toString());
        script.setAttribute('data-render-mode', 'embedded');

        containerRef.current.appendChild(script);

        return () => {
            if (containerRef.current) containerRef.current.innerHTML = '';
        }
    }, [config]);

    // Styling wrapper to center the button
    return (
        <div className="flex justify-center w-full">
            <div ref={containerRef} className="bold-payment-container [&>iframe]:!max-w-full [&>iframe]:!w-full" />
        </div>
    );
}
