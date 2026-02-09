# CLAUDE.md
## Condominium Food Ordering App — Product & Engineering Guide

This document defines how AI assistants (Claude, ChatGPT, etc.) should
think, reason, and make decisions when helping build this app.

If a suggestion conflicts with this document, this document wins.

---

## 1. PRODUCT PURPOSE

This app exists for TWO users:

### Tenants
- Order food FAST
- Minimal steps
- Works even for non-technical users
- No learning curve

### Restaurant Owner
- Centralize all orders
- Run daily operations from one place
- Reduce chaos, calls, and manual tracking
- Maintain full control of kitchen and delivery

This is NOT:
- A marketplace
- A multi-vendor platform
- A discovery app
- A “feature-rich” food app

This IS:
- A private ordering + operations system
- Owned and operated by the restaurant

---

## 2. CORE PRODUCT PRINCIPLES

### Principle 1: Speed over features
If a feature slows ordering or requires explanation, do not add it.

### Principle 2: One source of truth
If an order is not in the system, it does not exist.

### Principle 3: Defaults over decisions
Reduce user input wherever possible.
Auto-fill, pre-select, and reuse last choices.

### Principle 4: Simple outside, structured inside
Tenants see simplicity.
Owners see clarity.
Staff see order.

---

## 3. TARGET USERS

### Primary Tenant Personas
- Busy residents
- Older or non-technical users
- People who dislike apps
- People who just want food delivered to their unit

### Restaurant Personas
- Small restaurant owners
- Operators managing kitchen + delivery
- Staff with minimal technical training

Design must work without onboarding or tutorials.

---

## 4. USER EXPERIENCE RULES

### Tenant UX
- No complex navigation
- No search-heavy UI
- No filters or sorting
- Large buttons
- Clear language
- Minimal screens

Ideal flow:
Open → Choose food → Confirm unit → Done

### Owner / Staff UX
- Orders visible at a glance
- No hidden menus
- No nested admin settings
- Touch-friendly
- Works on tablets

---

## 5. ORDER LIFECYCLE (FIXED)

Orders move in one direction only:

1. New
2. Preparing
3. Ready
4. Delivered

No custom states.
No skipping.
No manual overrides unless critical.

---

## 6. WHAT NOT TO BUILD (VERY IMPORTANT)

Do NOT suggest or implement:
- Ratings or reviews
- Vendor discovery
- Advanced analytics dashboards
- Loyalty systems (v1)
- Complicated authentication flows
- Email/password logins if avoidable
- Feature flags unless absolutely required

---

## 7. MVP FEATURE BOUNDARIES

### Must-have
- Menu browsing
- Add to cart
- Unit-based delivery
- Order status
- Centralized order inbox
- Item availability toggle
- Pause orders
- Prep time control

### Explicitly out of scope (v1)
- Multi-restaurant support
- Multi-city support
- Complex promotions
- Coupons
- AI recommendations
- Chat systems

---

## 8. LANGUAGE & COPY GUIDELINES

Use human language, not tech language.

Good:
- "Order now"
- "Preparing your food"
- "On the way"
- "Delivered"

Bad:
- "Checkout"
- "Fulfillment"
- "Order pipeline"
- "Transaction status"

---

## 9. TECH PHILOSOPHY (HIGH LEVEL)

- Reliability > cleverness
- Simple architecture > abstractions
- Fewer dependencies > many tools
- Easy to maintain > scalable-in-theory

This app should be easy to operate by a small team.

---

## 10. DECISION FILTER FOR AI ASSISTANTS

Before suggesting anything, ask:

1. Does this make ordering faster?
2. Does this reduce owner stress?
3. Can a non-technical user use this immediately?
4. Does this reduce daily operational chaos?

If the answer is NO to any of the above, do not suggest it.

---

## 11. FINAL NOTE

This product is not trying to impress engineers.
It is trying to quietly work every day.

Simple.
Fast.
Reliable.
Human.

End of document.
