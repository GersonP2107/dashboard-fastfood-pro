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

    const { data: businessman } = await supabase.from('businessmans').select('id, email').eq('user_id', user.id).single();
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
        redirectionUrl: `${APP_URL}/checkout/result`
    };
}

export async function verifyPaymentOutcome(orderId: string, txStatus: string) {
    const supabase = await createClient();

    // Valid statuses from Bold logic (simplified for MVP)
    // approved, rejected, failed, pending

    // Update local payment record
    const statusMap: Record<string, string> = {
        'approved': 'approved',
        'rejected': 'rejected',
        'failed': 'rejected',
        'voided': 'voided',
        'pending': 'pending'
    };

    const dbStatus = statusMap[txStatus] || 'pending';

    const { data: payment, error: fetchError } = await supabase
        .from('payments')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
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
        // If query returns string, parse it. If null, use now.
        // If current subscription is active and in future, add time to it.
        // If past due or canceled, start from now.
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
                subscription_end: newEndDate.toISOString()
            })
            .eq('id', payment.businessman_id);

        if (updateError) {
            console.error("Error updating subscription:", updateError);
            return { success: false, error: "Error al activar la suscripción." };
        }
    }

    return { success: true, status: dbStatus };
}
