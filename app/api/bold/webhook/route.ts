import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Bold Webhook Handler
 * 
 * Receives POST notifications from Bold when a transaction status changes.
 * Events: SALE_APPROVED, SALE_REJECTED, VOID_APPROVED, VOID_REJECTED
 * 
 * Signature verification:
 * 1. Read raw body
 * 2. Encode to Base64
 * 3. HMAC-SHA256 with BOLD_SECRET_KEY
 * 4. Compare with x-bold-signature header
 */
export async function POST(request: NextRequest) {
    try {
        // Read raw body for signature verification
        const rawBody = await request.text();
        const receivedSignature = request.headers.get('x-bold-signature');

        // Verify signature if present
        if (receivedSignature && BOLD_SECRET_KEY) {
            const encodedBody = Buffer.from(rawBody).toString('base64');
            const computedSignature = crypto
                .createHmac('sha256', BOLD_SECRET_KEY)
                .update(encodedBody)
                .digest('hex');

            const isValid = crypto.timingSafeEqual(
                Buffer.from(computedSignature),
                Buffer.from(receivedSignature)
            );

            if (!isValid) {
                console.error('[Bold Webhook] Invalid signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        // Parse body
        const event = JSON.parse(rawBody);
        const eventType = event.type as string;
        const data = event.data;

        if (!data) {
            return NextResponse.json({ error: 'No data in event' }, { status: 400 });
        }

        // Extract our order reference from metadata
        const boldOrderId = data.metadata?.reference as string;
        const boldPaymentId = data.payment_id as string;

        if (!boldOrderId) {
            console.warn('[Bold Webhook] No reference in metadata, skipping');
            return NextResponse.json({ ok: true });
        }

        console.log(`[Bold Webhook] Event: ${eventType}, Order: ${boldOrderId}, PaymentId: ${boldPaymentId}`);

        // Use service role client for admin operations
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        if (eventType === 'SALE_APPROVED') {
            // Update payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .update({
                    status: 'approved',
                    bold_tx_id: boldPaymentId,
                    updated_at: new Date().toISOString()
                })
                .eq('bold_order_id', boldOrderId)
                .select('*, plans(*)')
                .single();

            if (paymentError || !payment) {
                console.error('[Bold Webhook] Error updating payment:', paymentError);
                return NextResponse.json({ ok: true }); // Still return 200 to avoid retries
            }

            // Activate subscription
            const plan = payment.plans;
            if (plan) {
                // Check if subscription is still in the future, accumulate time
                const { data: businessman } = await supabase
                    .from('businessmans')
                    .select('subscription_end')
                    .eq('id', payment.businessman_id)
                    .single();

                let newEndDate = new Date();
                if (businessman?.subscription_end && new Date(businessman.subscription_end) > new Date()) {
                    newEndDate = new Date(businessman.subscription_end);
                }
                newEndDate.setDate(newEndDate.getDate() + plan.duration_days);

                await supabase
                    .from('businessmans')
                    .update({
                        plan_type: plan.plan_type,
                        subscription_status: 'active',
                        subscription_end: newEndDate.toISOString(),
                        trial_ends_at: null // Clear trial on successful payment
                    })
                    .eq('id', payment.businessman_id);

                console.log(`[Bold Webhook] Subscription activated for businessman ${payment.businessman_id}`);
            }
        } else if (eventType === 'SALE_REJECTED') {
            await supabase
                .from('payments')
                .update({
                    status: 'rejected',
                    bold_tx_id: boldPaymentId,
                    updated_at: new Date().toISOString()
                })
                .eq('bold_order_id', boldOrderId);

            console.log(`[Bold Webhook] Payment rejected for order ${boldOrderId}`);
        } else if (eventType === 'VOID_APPROVED') {
            await supabase
                .from('payments')
                .update({
                    status: 'voided',
                    updated_at: new Date().toISOString()
                })
                .eq('bold_order_id', boldOrderId);

            console.log(`[Bold Webhook] Payment voided for order ${boldOrderId}`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Bold Webhook] Unhandled error:', error);
        // Always return 200 to prevent Bold from retrying
        return NextResponse.json({ ok: true });
    }
}
