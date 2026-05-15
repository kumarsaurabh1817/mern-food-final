# Frontend Design Prompts

This document contains the master design context and the specific, uniquely crafted design prompts for each page of the frontend. Use these when prompting an AI to generate the individual pages to ensure a cohesive, premium, and highly modern aesthetic.

## Master Context File

Save the following text as `frontend-design.md` in the root of your project or include it as context in all your generation requests.

```text
PROJECT:
Modern premium food delivery platform.

GOAL:
Refactor entire frontend into a highly modern,
memorable, production-grade UI.

AESTHETIC:
Neo-glassmorphism mixed with premium editorial design.

INSPIRED BY:
- Zomato premium redesign
- Stripe animations
- Apple spacing system
- Framer motion interactions
- Swiggy modern cards
- Uber Eats dark elegance

RULES:
- Large immersive maps
- Cinematic hero sections
- Floating glass cards
- Smooth page transitions
- High-end typography
- Avoid generic SaaS look
- Avoid boring Tailwind templates
- Use asymmetrical layouts
- Use layered depth and motion
- Mobile-first responsiveness
- Premium dark theme
- Rich microinteractions

TECH:
React + Tailwind + Framer Motion + Shadcn UI

IMPORTANT:
Every page must feel uniquely crafted.
```

## Page-Specific Prompts

When generating each page, provide the master context (by referencing `frontend-design.md` or pasting its contents) and then append the corresponding page-specific prompt below.

### 1. Home

```text
Read frontend-design.md before generating UI.

PAGE: Home

SPECIFIC REQUIREMENTS:
- Create a cinematic hero section with a dark elegance background and a prominent, glassmorphic search/location bar.
- Design curated category carousels (e.g., "Trending", "Healthy", "Gourmet") with subtle hover scaling (Framer Motion).
- Feature "Top Rated" restaurants using an asymmetrical grid layout to avoid boring, repetitive cards.
- Implement layered depth: use background blur and semi-transparent dark layers for floating elements.
- Include a floating, glass-effect bottom navigation bar for mobile responsiveness.
- Ensure rich microinteractions on all clickable elements (buttons, cards, search input).
```

### 2. Restaurant Page

```text
Read frontend-design.md before generating UI.

PAGE: Restaurant Page

SPECIFIC REQUIREMENTS:
- Start with a large, immersive cover photo featuring a parallax scrolling effect.
- The restaurant details (name, rating, delivery time) should sit inside a floating glass card overlapping the cover photo.
- Use a sticky, glassmorphic category sidebar (desktop) or a horizontally scrollable tab list (mobile) for the menu.
- Present menu items with high-end typography and premium editorial spacing (Apple-inspired).
- Add rich microinteractions when the "Add to Cart" button is clicked (e.g., a smooth spring animation, color pulse).
- Maintain a premium dark theme background to make food imagery pop.
```

### 3. Cart

```text
Read frontend-design.md before generating UI.

PAGE: Cart / Slide-out Cart

SPECIFIC REQUIREMENTS:
- Design the cart as an elegant, semi-transparent glassmorphic drawer or a dedicated asymmetrical page.
- Display cart items as floating glass cards with smooth exit/enter animations when quantities change.
- The typography for pricing and totals should feel premium, using clear visual hierarchy.
- Include a "Bill Summary" section with layered depth, avoiding standard flat table layouts.
- Ensure a cinematic "Proceed to Checkout" button with an animated gradient or subtle shine effect.
```

### 4. Delivery Tracking

```text
Read frontend-design.md before generating UI.

PAGE: Delivery Tracking

SPECIFIC REQUIREMENTS:
- The background should be a large immersive map (styled with a dark elegance theme, similar to Uber Eats).
- The tracking status and agent details must be housed in a beautifully layered, floating glass card at the bottom of the screen.
- Use Stripe-inspired smooth animations for the progress bar or status timeline.
- Include a prominent, circular avatar for the delivery agent with a subtle glowing border.
- The layout must be purely mobile-first, ensuring the map is the hero and the UI floats naturally over it.
```

### 5. Delivery Agent Dashboard

```text
Read frontend-design.md before generating UI.

PAGE: Delivery Agent Dashboard

SPECIFIC REQUIREMENTS:
- Focus on utilitarian but premium design. The active route should be on a large immersive map.
- Current order details and customer address should appear in Swiggy-inspired modern floating cards.
- Use Framer Motion to create a satisfying "Swipe to Accept" or "Swipe to Complete" interaction button.
- The dark theme must have high contrast for outdoor visibility while maintaining the neo-glassmorphism aesthetic.
- Avoid generic admin templates; use an asymmetrical layout to prioritize active tasks over secondary stats.
```

### 6. User Profile

```text
Read frontend-design.md before generating UI.

PAGE: User Profile

SPECIFIC REQUIREMENTS:
- Apply Apple's spacing system to create a clean, editorial layout for user settings and history.
- The top section should feature the user's avatar and stats in a premium, layered presentation.
- Use glassmorphic tabs to switch between "Orders", "Addresses", and "Payments".
- Display past orders as elegant cards with a highly visible, micro-animated "Reorder" button.
- Ensure transitions between tabs use smooth, cross-fade and slide page transitions.
```

### 7. Checkout

```text
Read frontend-design.md before generating UI.

PAGE: Checkout

SPECIFIC REQUIREMENTS:
- Create a frictionless, premium checkout experience with a split layout on desktop (form on left, floating summary on right).
- Input fields should be custom-styled, avoiding default browser looks—use floating labels, dark backgrounds, and subtle glow on focus.
- The flow (Address -> Payment) should use smooth Framer Motion accordion or step transitions.
- Maintain the dark elegance aesthetic with minimal distractions.
- Include trust badges and secure payment icons styled to match the neo-glassmorphism theme.
```

### 8. Offers Page

```text
Read frontend-design.md before generating UI.

PAGE: Offers & Discounts

SPECIFIC REQUIREMENTS:
- Design a visually vibrant yet elegant page using a dynamic, asymmetrical masonry layout for different deals.
- Coupon cards should feel like physical premium tickets, utilizing layered depth, glassmorphism, and subtle tilt on hover.
- Use high-end typography to highlight discount percentages and terms clearly without feeling cluttered.
- Introduce a "Tap to copy code" interaction with a satisfying checkmark animation and toast notification.
- Include a cinematic hero banner at the top announcing the biggest current promotion.
```
