#!/bin/bash

# Commit das melhorias de responsividade da landing page
cd /vercel/share/v0-project

# Add all changes
git add -A

# Commit com mensagem descritiva
git commit -m "feat: improve landing page responsiveness and hero section layout

- Reorganize hero section with better mobile-first layout using clamp() for typography
- Add responsive padding and spacing (sm:, md:, lg: breakpoints)
- Improve before/after comparison component for mobile devices (max-w-xs on mobile)
- Optimize button layout to stack on mobile with flex-col and responsive gap
- Add scroll indicator with chevron animation at bottom of hero
- Add floating decorations component for enhanced visual experience
- Ensure full responsivity from 320px (mobile) to 1440px+ (desktop)

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"

# Push to current branch
git push origin HEAD
