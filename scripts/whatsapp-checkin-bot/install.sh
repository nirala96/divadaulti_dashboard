#!/bin/bash
# Schedules the WhatsApp check-in bot to run at 1:00 PM and 6:00 PM every day
# on this Mac (a missed run happens as soon as the Mac wakes up).
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="$(command -v node)"
LABEL="com.divadaulti.whatsapp-checkin"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/divadaulti-checkin-bot.log"

if [ ! -f "$DIR/.env" ]; then
  echo "Missing $DIR/.env - copy .env.example to .env and fill it in first."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$DIR/checkin.mjs</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>18</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "Installed. Runs daily at 1:00 PM and 6:00 PM."
echo "Log file: $LOG"
echo
echo "ONE-TIME STEP: give Full Disk Access to this program so it can read WhatsApp's chat list:"
echo "  $(readlink -f "$NODE" 2>/dev/null || echo "$NODE")"
echo "  System Settings > Privacy & Security > Full Disk Access > + (press Cmd+Shift+G and paste the path)"
