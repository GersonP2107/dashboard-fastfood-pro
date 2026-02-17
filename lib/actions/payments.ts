'use server'

import { createClient } from '@/lib/supabase/server'
import { generateBoldSignature } from '@/lib/bold'
import { Plan } from '@/lib/types/payments'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

const BOLD_API_KEY = process.env.BOLD_API_KEY!;
const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY!;
const BOLD_INTEGRITY_KEY = process.env.BOLD_INTEGRITY_KEY! || process.env.BOLD_SECRET_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function getPlans() {
    const supabase = await createClient();
    const { data } = await supabase.from('plans').select('*').eq('is_active', true).order('price');
    return data as Plan[];
}

export async function initiatePayment(planId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: businessman } = await supabase.from('businessmans').select('id, email, business_name, trial_ends_at').eq('user_id', user.id).single();
    if (!businessman) throw new Error('Businessman not found');

    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) throw new Error('Plan not found');

    // Create unique order ID
    const boldOrderId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Insert pending payment record
    const { error } = await supabase.from('payments').insert({
        businessman_id: businessman.id,
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
        bold_order_id: boldOrderId
    });

    if (error) {
        console.error("Payment insert error:", error);
        throw new Error('Failed to create payment record');
    }

    // Generate Integrity Signature
    // Concatenation: orderId + amount + currency + secret
    const integritySignature = generateBoldSignature(
        boldOrderId,
        plan.price.toString(),
        plan.currency,
        BOLD_INTEGRITY_KEY
    );

    return {
        apiKey: BOLD_API_KEY,
        orderId: boldOrderId,
        amount: plan.price,
        currency: plan.currency,
        integritySignature,
        description: `Pago de plan ${plan.name}`,
        tax: 0,
        redirectionUrl: `${APP_URL}/checkout/result`,
        originUrl: `${APP_URL}/billing`,
        customerData: {
            email: businessman.email || user.email || '',
            fullName: businessman.business_name || '',
        },
        trialEndsAt: businessman.trial_ends_at,
    };
}

/**
 * Verify transaction status against Bold's API.
 * This provides a more reliable status than the redirect query params.
 */
async function verifyWithBoldAPI(orderId: string): Promise<{ status: string; txId?: string } | null> {
    try {
        const response = await fetch(
            `https://payments.api.bold.co/v2/payment-voucher/${orderId}`,
            {
                headers: { 'x-api-key': BOLD_API_KEY },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        const paymentStatus = data.payment_status as string;

        // Map Bold API statuses to our internal statuses
        const apiStatusMap: Record<string, string> = {
            'APPROVED': 'approved',
            'REJECTED': 'rejected',
            'FAILED': 'rejected',
            'VOIDED': 'voided',
            'PROCESSING': 'pending',
            'PENDING': 'pending',
            'NO_TRANSACTION_FOUND': 'pending',
        };

        return {
            status: apiStatusMap[paymentStatus] || 'pending',
            txId: data.transaction_id,
        };
    } catch (error) {
        console.error('Bold API verification failed:', error);
        return null;
    }
}

export async function verifyPaymentOutcome(orderId: string, txStatus: string) {
    const supabase = await createClient();

    // Try to verify with Bold API first (more reliable than redirect params)
    const boldVerification = await verifyWithBoldAPI(orderId);

    // Use Bold API status if available, fall back to redirect param
    const redirectStatusMap: Record<string, string> = {
        'approved': 'approved',
        'rejected': 'rejected',
        'failed': 'rejected',
        'voided': 'voided',
        'pending': 'pending'
    };

    const dbStatus = boldVerification?.status || redirectStatusMap[txStatus] || 'pending';
    const boldTxId = boldVerification?.txId || null;

    const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .update({
            status: dbStatus,
            bold_tx_id: boldTxId,
            updated_at: new Date().toISOString()
        })
        .eq('bold_order_id', orderId)
        .select('*, plans(*)')
        .single();

    if (fetchError || !payment) {
        console.error("Error updating payment:", fetchError);
        return { success: false, error: "Conexión de pago no encontrada." };
    }

    // If approved, update subscription
    if (dbStatus === 'approved') {
        const plan = payment.plans; // Joined data
        if (!plan) return { success: false, error: "Plan asociado no encontrado." };

        const { data: businessman } = await supabase
            .from('businessmans')
            .select('subscription_end, subscription_status')
            .eq('id', payment.businessman_id)
            .single();

        let newEndDate = new Date();
        if (businessman?.subscription_end && new Date(businessman.subscription_end) > new Date()) {
            newEndDate = new Date(businessman.subscription_end);
        }

        // Add duration
        newEndDate.setDate(newEndDate.getDate() + plan.duration_days);

        const { error: updateError } = await supabase
            .from('businessmans')
            .update({
                plan_type: plan.plan_type,
                subscription_status: 'active',
                subscription_end: newEndDate.toISOString(),
                trial_ends_at: null // Clear trial on successful payment
            })
            .eq('id', payment.businessman_id);

        if (updateError) {
            console.error("Error updating subscription:", updateError);
            return { success: false, error: "Error al activar la suscripción." };
        }
    }

    return { success: true, status: dbStatus };
}
