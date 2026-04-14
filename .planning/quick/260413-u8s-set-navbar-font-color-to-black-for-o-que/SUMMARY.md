Updated the landing page navbar so the `O que é o ATS?` and `Preços` links render with black text.

What changed:
- Updated `src/components/landing/header.tsx` to replace the muted foreground classes on those two links with explicit black text classes.
- Kept the rest of the navbar styling and behavior unchanged.

Verification:
- Reviewed the diff in `src/components/landing/header.tsx` to confirm only the two requested links changed color classes.
