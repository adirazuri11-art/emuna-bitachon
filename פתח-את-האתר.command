#!/bin/sh
# לחיצה כפולה על הקובץ הזה מרימה את האתר ופותחת אותו בדפדפן.
# להשאיר את חלון הטרמינל פתוח כל עוד גולשים באתר.
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH"

# פותח את הדפדפן אחרי שהשרת מספיק לעלות
( sleep 6 && open http://localhost:3010 ) &

exec npm run dev -- -p 3010
