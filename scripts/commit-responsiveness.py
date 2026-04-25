#!/usr/bin/env python3
import subprocess
import os

os.chdir('/vercel/share/v0-project')

# Add all changes
subprocess.run(['git', 'add', '-A'], check=True)

# Commit com mensagem descritiva
commit_message = """feat: improve landing page responsiveness and hero section layout

- Reorganize hero section with better mobile-first layout using clamp() for typography
- Add responsive padding and spacing (sm:, md:, lg: breakpoints)
- Improve before/after comparison component for mobile devices (max-w-xs on mobile)
- Optimize button layout to stack on mobile with flex-col and responsive gap
- Add scroll indicator with chevron animation at bottom of hero
- Add floating decorations component for enhanced visual experience
- Ensure full responsivity from 320px (mobile) to 1440px+ (desktop)

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"""

subprocess.run(['git', 'commit', '-m', commit_message], check=True)

# Push to current branch
result = subprocess.run(['git', 'push', 'origin', 'HEAD'], capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
