import { getFinancialStats, DateRange } from '@/lib/actions/finance';
import { getOrders, getHistoryOrders } from '@/lib/actions/orders';
import { getProducts } from '@/lib/actions/products';

// Define the shape of a tool available to the AI
export type ToolDefinition = {
    name: string;
    description: string;
    parameters: string; // JSON schema or description of params for the prompt
};

export const AVAILABLE_TOOLS: ToolDefinition[] = [
    {
        name: 'get_financial_stats',
        description: 'Get financial overview: total sales, order count, top products, payment methods.',
        parameters: '{ "range": "today" | "week" | "month" | "last7days" } (Default: "today")'
    },
    {
        name: 'get_recent_orders',
        description: 'Get a list of the most recent orders (live status). Use this to check current activity.',
        parameters: '{} (No parameters)'
    },
    {
        name: 'get_order_history',
        description: 'Get historical orders filtered by date or status.',
        parameters: '{ "startDate"?: "YYYY-MM-DD", "endDate"?: "YYYY-MM-DD", "status"?: "completed" | "cancelled" | "all" }'
    },
    {
        name: 'list_products',
        description: 'List all products in the menu with their prices and availability.',
        parameters: '{} (No parameters)'
    }
];

// Dispatcher to run the tools
export async function runTool(toolName: string, args: any, businessmanId: string) {
    switch (toolName) {
        case 'get_financial_stats':
            return await getFinancialStats(businessmanId, args.range || 'today');

        case 'get_recent_orders':
            const orders = await getOrders(businessmanId);
            return orders.slice(0, 15).map(o => ({
                id: o.id.substring(0, 8), // Short ID
                total: o.total,
                status: o.status,
                payment: o.payment_method,
                created_at: o.created_at,
                items: o.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || 'Sin productos'
            }));

        case 'get_order_history':
            // Robust Date Handling
            let start, end;

            if (args.startDate) {
                // Force start of day 
                start = new Date(args.startDate);
                start.setHours(0, 0, 0, 0); // Local start
            }

            if (args.endDate) {
                end = new Date(args.endDate);
                end.setHours(23, 59, 59, 999);
            } else if (args.startDate && !args.endDate) {
                // If only startDate is provided, assume user wants THAT full day
                end = new Date(args.startDate);
                end.setHours(23, 59, 59, 999);
            }

            console.log(`[AI-TOOL] Searching history from ${start?.toISOString()} to ${end?.toISOString()}`);

            const history = await getHistoryOrders(businessmanId, { startDate: start, endDate: end, status: args.status });

            // Limit history to avoided token explosion
            if (!history || history.length === 0) {
                return [];
            }

            return history.slice(0, 20).map(o => ({
                id: o.id.substring(0, 8),
                total: o.total,
                status: o.status,
                payment: o.payment_method,
                created_at: o.created_at,
                items: o.order_items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ') || 'Sin productos'
            }));

        case 'list_products':
            const products = await getProducts(businessmanId);
            // Simplify product output to save tokens
            return products.map(p => ({
                name: p.name,
                price: p.price,
                stock: p.stock_quantity,
                available: p.is_available,
                category: p.category?.name
            }));

        default:
            return { error: `Tool ${toolName} not found.` };
    }
}
