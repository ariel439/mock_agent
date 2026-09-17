# TCODE-102 — Add filters and an order summary

**Type:** Story · **Priority:** High · **Project:** Soft Rock Coffee

As a customer, I want to filter the drinks menu and build an order so I can choose my coffee and see the total before ordering at the counter.

Add temperature filters and a simple order summary to the menu from TCODE-101. Keep the current café design and photos. Use plain JavaScript with no backend or checkout.

Acceptance criteria:
- Add All drinks, Hot, and Iced buttons above the menu. Show the selected filter and the number of visible drinks.
- Add an Add to order button to each drink card.
- Below the menu, show an order summary with each selected drink, quantity, and line subtotal.
- Adding a drink again increases its quantity instead of creating a duplicate row.
- Include increase, decrease, and Remove controls; decreasing to zero removes the drink. Quantities range from 1 to 99.
- Update the drink count and total immediately, using the menu's USD prices and accurate cent arithmetic.
- Filtering the menu must not remove anything from the order.
- Include a Clear order action and an empty-order message. Clearing restores the $0.00 total.
- All controls must work with the keyboard and announce order updates accessibly.
- Keep the order in memory only: refreshing the browser clears it. No payment, checkout, network requests, or persistent storage.
