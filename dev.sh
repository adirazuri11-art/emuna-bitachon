#!/bin/sh
# מריץ את שרת הפיתוח עם Node המקומי (~/.local/node)
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")"
exec npm run dev -- -p 3010
