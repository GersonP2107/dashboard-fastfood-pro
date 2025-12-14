# Dashboard Database Setup

## Step 1: Run the Database Migration

1. Open your Supabase project dashboard
2. Go to the **SQL Editor**
3. Copy the contents of `dashboard-schema.sql`
4. Paste and execute the SQL script

This will create:
- `business_settings` table
- `order_status_history` table
- Row Level Security (RLS) policies
- Necessary indexes
- Triggers for auto-updating timestamps

## Step 2: Verify Tables

After running the migration, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('business_settings', 'order_status_history');
```

## Step 3: Check Existing Orders Table

The dashboard assumes you already have an `orders` table from the digital-menu project. Verify it exists:

```sql
SELECT * FROM orders LIMIT 1;
```

If the `orders` table doesn't exist, you'll need to create it. Refer to the digital-menu project's database schema.

## Step 4: Initialize Business Settings

The migration automatically creates default settings for existing businesses. You can verify:

```sql
SELECT * FROM business_settings;
```

If you need to manually create settings for a specific business:

```sql
INSERT INTO business_settings (businessman_id)
VALUES ('YOUR_BUSINESSMAN_ID_HERE')
ON CONFLICT (businessman_id) DO NOTHING;
```

## Step 5: Test RLS Policies

Make sure you're logged in as a user who owns a business, then test:

```sql
-- This should return your business settings
SELECT * FROM business_settings;

-- This should return order history for your orders
SELECT * FROM order_status_history;
```

## Troubleshooting

### Issue: RLS policies blocking access

**Solution**: Ensure your user is properly linked to a businessman record:

```sql
SELECT b.* 
FROM businessmans b
WHERE b.user_id = auth.uid();
```

### Issue: Orders not appearing

**Solution**: Check if orders exist for your business:

```sql
SELECT o.* 
FROM orders o
INNER JOIN businessmans b ON o.businessman_id = b.id
WHERE b.user_id = auth.uid();
```

## Next Steps

After setting up the database:
1. Start the dashboard: `npm run dev`
2. Login with your business owner credentials
3. Navigate to the Orders page
4. Test creating an order from the digital-menu app
5. Verify real-time updates appear in the dashboard
