# Quick Testing Guide for Landing Page

## 🔍 How to Test Your New Landing Page

### Step 1: View as Non-Authenticated User

1. Open your browser in **Incognito/Private Mode**
2. Navigate to `http://localhost:5173` (or your dev URL)
3. You should see the **landing page** with:
   - Hero section with "Organize Your Life with HiveOS"
   - 3D mockup card (flat on mobile)
   - Features grid (9 feature cards)
   - How It Works (3 steps)
   - Use Cases (4 cards)
   - **NEW: FAQ section with 8 questions**
   - Final CTA
   - **NEW: Footer**

### Step 2: Test Mobile Responsiveness

Use Chrome DevTools:

1. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Click the device toolbar icon (or `Ctrl+Shift+M`)
3. Test these breakpoints:

#### 📱 iPhone SE (375px)

- [ ] Hero text is readable
- [ ] Buttons are full-width
- [ ] Buttons stack vertically
- [ ] Mockup card is flat (no 3D effect)
- [ ] Feature cards are single column
- [ ] FAQ items are easy to tap
- [ ] Footer is single column, centered

#### 📱 iPhone 14 Pro (393px)

- [ ] Similar to iPhone SE
- [ ] All content fits without horizontal scroll

#### 📱 Samsung Galaxy S21 (360px)

- [ ] Smallest mobile view
- [ ] Text remains readable
- [ ] Touch targets are at least 44px

#### 📱 iPad (768px)

- [ ] Steps section goes vertical
- [ ] Footer becomes 2 columns
- [ ] Features grid has 2 columns

#### 💻 iPad Pro (1024px)

- [ ] Desktop-like layout begins
- [ ] Hero becomes 2 columns
- [ ] All hover effects work

### Step 3: Test FAQ Functionality

1. Click on each FAQ question
2. Verify:
   - [ ] Answer slides down smoothly
   - [ ] Icon changes from + to −
   - [ ] Border color changes to yellow
   - [ ] Previous answer closes when opening new one
   - [ ] Can close by clicking again

### Step 4: Test SEO Tags

#### View Source Method:

1. Right-click on page → "View Page Source"
2. Search for these tags (Ctrl+F):
   - `<title>HiveOS - Organize Your Life`
   - `<meta name="description"`
   - `<meta property="og:title"`
   - `<meta property="twitter:card"`
   - `<link rel="canonical"`

#### SEO Tools:

1. **Chrome Extension**: Install "SEO META in 1 CLICK"
2. **Online Tools**: Use https://metatags.io/
3. Paste your URL and verify all tags appear correctly

### Step 5: Test Footer Links

- [ ] All links are clickable
- [ ] Hover effect changes color to yellow
- [ ] Copyright year is current (2025)
- [ ] Footer sticks to bottom

### Step 6: Test Across Browsers

Visit in Incognito/Private mode:

- [ ] **Chrome** - Should be perfect (dev browser)
- [ ] **Firefox** - Check layout consistency
- [ ] **Safari** - Verify gradient effects work
- [ ] **Edge** - Confirm responsive breakpoints

### Step 7: Performance Check

1. Open DevTools → Lighthouse tab
2. Select "Mobile" and "Desktop"
3. Click "Generate report"
4. Target scores:
   - **Performance**: 90+
   - **Accessibility**: 95+
   - **Best Practices**: 95+
   - **SEO**: 100

### Step 8: Accessibility Check

1. **Keyboard Navigation**:
   - [ ] Tab through all interactive elements
   - [ ] FAQ items open with Enter/Space
   - [ ] All buttons are reachable
   - [ ] Tab order makes sense

2. **Screen Reader** (Optional):
   - Windows: NVDA (free)
   - Mac: VoiceOver (built-in)
   - [ ] FAQ questions announce properly
   - [ ] Buttons have clear labels

3. **Color Contrast**:
   - Use WebAIM Contrast Checker
   - [ ] All text meets WCAG AA standard

---

## 🎨 Visual Checklist

### Desktop View (>1024px)

```
┌─────────────────────────────────────┐
│ Header: HiveOS | ViewMode | Logout  │
├─────────────────────────────────────┤
│                                     │
│  Hero: Text | Mockup Card (3D)     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Features: 3x3 Grid                │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  How It Works: 1 → 2 → 3          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Use Cases: 2x2 Grid               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  FAQ: Accordion (single column)     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Final CTA: Centered                │
│                                     │
├─────────────────────────────────────┤
│  Footer: 4 columns                  │
└─────────────────────────────────────┘
```

### Mobile View (<640px)

```
┌───────────┐
│  Header   │
├───────────┤
│           │
│   Hero    │
│   Text    │
│  [Button] │
│  [Button] │
│           │
├───────────┤
│           │
│  Mockup   │
│   Card    │
│  (Flat)   │
│           │
├───────────┤
│           │
│ Feature 1 │
│ Feature 2 │
│ Feature 3 │
│ Feature 4 │
│ Feature 5 │
│ Feature 6 │
│ Feature 7 │
│ Feature 8 │
│ Feature 9 │
│           │
├───────────┤
│  Step 1   │
│     ↓     │
│  Step 2   │
│     ↓     │
│  Step 3   │
├───────────┤
│ UseCase 1 │
│ UseCase 2 │
│ UseCase 3 │
│ UseCase 4 │
├───────────┤
│ FAQ 1 [+] │
│ FAQ 2 [+] │
│ FAQ 3 [+] │
│ FAQ 4 [+] │
│ FAQ 5 [+] │
│ FAQ 6 [+] │
│ FAQ 7 [+] │
│ FAQ 8 [+] │
├───────────┤
│Final CTA  │
├───────────┤
│  Footer   │
│(Centered) │
└───────────┘
```

---

## 🐛 Common Issues & Fixes

### Issue: FAQ won't collapse

**Fix**: Check browser console for errors. Make sure `openFaqIndex` state is working.

### Issue: 3D effect not showing on desktop

**Fix**: Check if `perspective: 1000px` is applied to `.hero-visual`

### Issue: Buttons not full-width on mobile

**Fix**: Verify media query `@media screen and (max-width: 640px)` is active

### Issue: Footer columns not responsive

**Fix**: Check grid-template-columns changes at 768px and 640px breakpoints

### Issue: SEO tags not appearing

**Fix**: Make sure you're viewing as non-authenticated (Incognito mode)

---

## 📸 Screenshot Checklist

Take screenshots for documentation:

1. [ ] Desktop hero section
2. [ ] Desktop features grid
3. [ ] Desktop FAQ section
4. [ ] Mobile hero section
5. [ ] Mobile FAQ (expanded)
6. [ ] Mobile footer
7. [ ] iPad landscape view
8. [ ] Lighthouse score

---

## ✅ Sign-Off Checklist

Before considering this complete:

- [ ] Tested on at least 3 different devices
- [ ] All FAQ items open/close correctly
- [ ] No horizontal scroll at any width
- [ ] All links work (even if placeholder)
- [ ] SEO tags visible in page source
- [ ] Footer displays correctly
- [ ] No console errors
- [ ] Images/emojis load properly
- [ ] Smooth animations on desktop
- [ ] Readable text at all sizes

---

## 🎯 Success Metrics

After launch, track:

1. **Bounce Rate**: Should be <70%
2. **Time on Page**: Target 1-2 minutes
3. **Scroll Depth**: 60%+ should scroll past fold
4. **CTA Click Rate**: 5-10% is good
5. **Mobile vs Desktop**: Should be ~50/50

---

## 🚀 Ready to Deploy?

Once testing is complete:

1. Commit your changes
2. Push to repository
3. Deploy to production
4. Test on live URL
5. Submit to search engines
6. Share on social media

**Your landing page is now production-ready!** 🎉
