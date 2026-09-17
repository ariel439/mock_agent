# TCODE-102 — Make services easy to find

**Type:** Story · **Priority:** High · **Project:** Service Hub

As an employee, I want to search and filter the service catalog so I can find the right service without scanning every card.

Add live search and category filters above the catalog from TCODE-101. Match the existing magenta design and use plain JavaScript.

Acceptance criteria:
- Filter cards as the user types, ignoring letter case and surrounding whitespace.
- Include All, Infrastructure, Security, and Data filter buttons with a visible selected state.
- Search and category filters work together.
- Show the number of matching services and update it accessibly.
- When nothing matches, show “No services found” and a Clear filters action.
- Clear filters restores all six services, clears the search, and selects All.
- Everything runs locally with no backend, provider, or external assets.
