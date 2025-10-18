# Payment & Subscription System

## Overview

HiveOS now has a realistic subscription payment flow with infrastructure ready for Stripe integration. Currently running in **mock mode** for development/testing, but designed to be easily swapped with real Stripe implementation.

## Current Implementation Status

✅ **Completed:**

- Subscription metadata in database (status, subscription_id, customer_id, billing dates)
- Mock Stripe service layer (`src/lib/server/subscriptions.ts`)
- Payment confirmation modals for tier upgrades
- Individual plan upgrade flow ($5/month)
- Family plan upgrade flow ($20/month) with group creation
- Subscription management page with cancel/reactivate
- Database migrations applied
- Zero permissions deployed

🔧 **Mock Mode Features:**

- Instant "payment" completion without real transactions
- Mock subscription IDs and customer IDs generated
- Simulated billing cycles (30 days)
- Full UI/UX flow identical to production

## Architecture

### Database Schema

**User table additions:**

```typescript
subscriptionTier: 'free' |
	'individual' |
	'family_member' |
	'family_admin' |
	'team_member' |
	'team_admin';
subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
subscriptionId: string; // Stripe subscription ID (sub_xxx)
stripeCustomerId: string; // Stripe customer ID (cus_xxx)
currentPeriodEnd: timestamp; // When current billing period ends
cancelAtPeriodEnd: boolean; // Whether subscription cancels at period end
```

### Files Structure

```
src/
├── lib/
│   ├── components/
│   │   └── subscriptionUpgradeModal.svelte    # Payment confirmation modal
│   └── server/
│       └── subscriptions.ts                    # Mock Stripe service layer
├── routes/
│   ├── account/
│   │   ├── +page.svelte                       # Updated with payment flows
│   │   └── subscription/
│   │       ├── +page.svelte                   # Subscription management UI
│   │       └── +page.server.ts                # Cancel/reactivate actions
│   └── api/
│       └── mock-checkout/
│           └── +server.ts                      # Mock payment completion
```

## User Flows

### 1. Individual Plan Upgrade ($5/month)

**Free User → Individual:**

1. User clicks "Upgrade Plan" on free tier badge
2. Modal shows Individual plan pricing and features
3. User clicks "Continue to Payment"
4. Redirected to `/api/mock-checkout?tier=individual`
5. Mock payment instantly succeeds
6. User redirected back to `/account?success=subscription_activated`
7. Database updated: `subscription_tier='individual'`, `subscription_status='active'`

### 2. Family Plan with Group Creation ($20/month)

**Creating a Family Group:**

1. User enters group name and clicks "Create Group"
2. System checks if user has active subscription
3. If free/unpaid: Shows Family Plan payment modal first
4. User confirms payment
5. Redirected to `/api/mock-checkout?tier=family`
6. Mock payment succeeds
7. User redirected to `/account?success=family_subscription_activated`
8. Group is automatically created with user as admin
9. Database updated: `subscription_tier='family_admin'`, `subscription_status='active'`

### 3. Subscription Management

**Viewing Subscription:**

- Navigate to `/account/subscription`
- View current plan, status, renewal date
- See mock notice about development mode

**Canceling Subscription:**

1. Click "Cancel Subscription"
2. Confirm cancellation
3. Subscription marked `cancel_at_period_end=true`
4. Access continues until `current_period_end`
5. After period ends, tier reverts to 'free' (would be handled by webhook)

**Reactivating:**

1. If canceled but still in billing period
2. Click "Reactivate Subscription"
3. `cancel_at_period_end` set back to false
4. Billing continues normally

## Mock Implementation Details

### Mock Checkout Flow

**File:** `src/routes/api/mock-checkout/+server.ts`

```typescript
// Simulates Stripe checkout completion
// In production: triggered by Stripe webhook
GET /api/mock-checkout?session=cs_mock_xxx&tier=family
```

Instantly:

- Validates session and tier
- Calls `activateSubscription()` with mock IDs
- Sets billing cycle to 30 days from now
- Redirects to success page

### Subscription Service

**File:** `src/lib/server/subscriptions.ts`

**Mock Mode Toggle:**

```typescript
const MOCK_MODE = true; // Set to false when using real Stripe
```

**Key Functions:**

- `createCheckoutSession()` - Returns mock checkout URL
- `activateSubscription()` - Updates DB with subscription data
- `cancelSubscription()` - Cancels immediately or at period end
- `reactivateSubscription()` - Resumes canceled subscription
- `getSubscriptionDetails()` - Fetches user subscription info
- `createPortalSession()` - Returns mock portal URL

All functions have commented-out real Stripe implementation ready to uncomment.

## Switching to Real Stripe

### Step 1: Install Stripe SDK

```bash
npm install stripe
```

### Step 2: Add Environment Variables

Add to `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Create Stripe Products

In Stripe Dashboard:

1. Create "Individual" product ($5/month recurring)
2. Create "Family" product ($20/month recurring)
3. Copy the Price IDs

Update `src/lib/server/subscriptions.ts`:

```typescript
export const PRICE_IDS = {
	individual: 'price_xxx', // Real Stripe price ID
	family: 'price_yyy',
	team: 'price_zzz'
};
```

### Step 4: Disable Mock Mode

In `src/lib/server/subscriptions.ts`:

```typescript
const MOCK_MODE = false; // Enable real Stripe
```

### Step 5: Uncomment Real Stripe Code

Each function has commented Stripe API calls. Example:

```typescript
// Before (mock):
if (MOCK_MODE) {
  return { sessionId: 'cs_mock_...', ... };
}

// After (real):
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const session = await stripe.checkout.sessions.create({...});
return {
  sessionId: session.id,
  checkoutUrl: session.url!,
  customerId: session.customer as string
};
```

### Step 6: Set Up Webhooks

**Create Webhook Endpoint:** `src/routes/api/webhooks/stripe/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import Stripe from 'stripe';
import {
	activateSubscription,
	handlePaymentFailed,
	handleSubscriptionRenewed
} from '$lib/server/subscriptions';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST({ request }) {
	const signature = request.headers.get('stripe-signature')!;
	const body = await request.text();

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
	} catch (err) {
		return json({ error: 'Invalid signature' }, { status: 400 });
	}

	switch (event.type) {
		case 'checkout.session.completed':
			const session = event.data.object as Stripe.Checkout.Session;
			await activateSubscription(
				session.metadata!.userId,
				session.metadata!.tier as any,
				session.subscription as string,
				session.customer as string
			);
			break;

		case 'invoice.payment_succeeded':
			const invoice = event.data.object as Stripe.Invoice;
			await handleSubscriptionRenewed(invoice.subscription as string);
			break;

		case 'invoice.payment_failed':
			const failedInvoice = event.data.object as Stripe.Invoice;
			await handlePaymentFailed(failedInvoice.subscription as string);
			break;
	}

	return json({ received: true });
}
```

**Configure Webhook in Stripe:**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. Copy webhook secret to `.env`

### Step 7: Update Frontend

**Install Stripe.js:** (if needed for custom checkout)

```bash
npm install @stripe/stripe-js
```

**Replace mock URLs:**
In components, replace `/api/mock-checkout` calls with real checkout URL from `createCheckoutSession()`.

## Testing

### Mock Mode Testing

1. **Free → Individual:**
   - Go to /account
   - Click "Upgrade Plan"
   - Confirm in modal
   - Verify tier updates to 'individual'
   - Check /account/subscription shows active status

2. **Free → Family (with group):**
   - Go to /account
   - Enter group name, click "Create Group"
   - See payment modal
   - Confirm payment
   - Verify group created and tier='family_admin'

3. **Cancel Subscription:**
   - Go to /account/subscription
   - Click "Cancel Subscription"
   - Confirm cancellation
   - Verify `cancel_at_period_end=true`
   - Click "Reactivate" to test reactivation

### Real Stripe Testing

Use Stripe test mode with test cards:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Business Logic

### Tier Restrictions

**Free Tier:**

- Cannot create groups
- Limited data storage
- Single device
- No collaboration

**Individual ($5/month):**

- Unlimited storage
- Multiple devices
- Can collaborate with other paid users
- Cannot create groups

**Family Admin ($20/month):**

- Creates/manages family group
- Up to 6 members
- Generate access codes
- Shared family lists
- All Individual features

**Family/Team Member:**

- Free for member (paid by admin's subscription)
- Access to group features
- Cannot manage group
- All Individual features

### Subscription Lifecycle

1. **Active:** Full access, subscription billing normally
2. **Cancel at Period End:** Full access until `current_period_end`, then downgrade
3. **Past Due:** Payment failed, grace period, limited access
4. **Canceled:** Downgraded to free tier, group access revoked

### Data Retention

When subscription canceled/expired:

- User's personal data retained
- Group membership removed
- Tier reverts to 'free'
- Subscription IDs kept for billing history
- Can resubscribe anytime

## Security Considerations

1. **Webhook Signature Verification:** Always verify Stripe webhook signatures
2. **Environment Variables:** Never commit Stripe keys
3. **HTTPS Required:** Stripe requires HTTPS for webhooks
4. **Subscription Status Checks:** Validate active subscription server-side before granting access
5. **Price ID Validation:** Verify price IDs match expected values

## Troubleshooting

**Issue:** Payment succeeds but tier doesn't update

- **Solution:** Check webhook is properly configured and receiving events

**Issue:** Mock checkout redirects but no changes

- **Solution:** Verify `activateSubscription()` is called in mock-checkout endpoint

**Issue:** Can't cancel subscription

- **Solution:** Check user has `subscription_id` in database

**Issue:** Group not created after family payment

- **Solution:** Check `success=family_subscription_activated` parameter triggers group creation in $effect

## Future Enhancements

- [ ] Team plan implementation (unlimited members)
- [ ] Annual billing option (discount)
- [ ] Proration on plan changes
- [ ] Invoice history page
- [ ] Payment method management
- [ ] Subscription pause/resume
- [ ] Referral credits
- [ ] Trial periods
- [ ] Dunning management for failed payments

## Migration from Mock to Production

When ready for production:

1. Complete Step 1-7 above
2. Test thoroughly in Stripe test mode
3. Create production Stripe products/prices
4. Update environment variables with production keys
5. Deploy to production with HTTPS enabled
6. Monitor Stripe Dashboard for successful webhooks
7. Set up alerts for payment failures

## Support

For Stripe integration help:

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
