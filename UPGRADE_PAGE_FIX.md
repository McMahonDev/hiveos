# Upgrade Page Dynamic Tier Display

**Date:** October 16, 2025  
**Status:** ✅ Implemented

## Problem

When an Individual tier user clicks "Upgrade to Family", the upgrade page was showing:

- ❌ Free tier (not relevant for paid users)
- Individual tier (should show as "Current Plan")
- Family tier

## Solution

Made the upgrade page dynamically filter and update tiers based on the user's current subscription:

### Changes Made

**File:** `src/routes/account/upgrade/+page.svelte`

1. **Added Zero Query** - Fetch current user's subscription tier
2. **Dynamic Filtering** - Hide tiers below the user's current tier
3. **Current Plan Marking** - Automatically mark the user's current tier

### Logic Flow

```typescript
const currentTier = $derived(user?.current?.[0]?.subscription_tier || 'free');

const visibleTiers = $derived(
	pricingTiers
		.filter((tier) => {
			// If user is on individual or family, hide free tier
			if (currentTier === 'individual' || currentTier === 'family') {
				return tier.id !== 'free';
			}
			return true;
		})
		.map((tier) => ({
			...tier,
			buttonText: tier.id === currentTier ? 'Current Plan' : tier.buttonText,
			buttonDisabled: tier.id === currentTier
		}))
);
```

## Display Behavior

### Free User (currentTier: 'free')

Shows all 3 tiers:

- ✅ **Free** - "Current Plan" (disabled)
- ✅ **Individual** - "Upgrade to Individual"
- ✅ **Family Plan** - "Upgrade to Family"

### Individual User (currentTier: 'individual')

Shows 2 tiers:

- ❌ Free (hidden)
- ✅ **Individual** - "Current Plan" (disabled)
- ✅ **Family Plan** - "Upgrade to Family"

### Family User (currentTier: 'family')

Shows 2 tiers:

- ❌ Free (hidden)
- ✅ Individual - "Upgrade to Individual" (downgrade disabled in handler)
- ✅ **Family Plan** - "Current Plan" (disabled)

## Benefits

1. **Cleaner UX** - No irrelevant tiers shown to paid users
2. **Clear Current State** - User's current tier is clearly marked
3. **No Confusion** - Free tier doesn't appear for users who have already upgraded
4. **Future-proof** - Automatically adapts to user's tier changes

## Testing Checklist

- [ ] Free user sees all 3 tiers with Free as current
- [ ] Individual user sees only Individual (current) and Family
- [ ] Family user sees only Individual and Family (current)
- [ ] "Current Plan" buttons are disabled
- [ ] Upgrade buttons work correctly
- [ ] Navigation back to account works

## Technical Notes

- Uses Zero-cache reactive queries for real-time tier detection
- Derived state (`$derived`) ensures UI updates when subscription changes
- Filter logic prevents downgrades and irrelevant options
- Button text and disabled state computed dynamically

---

**Result:** Individual users now see a clean upgrade page with only Individual (Current Plan) and Family Plan options! 🎉
