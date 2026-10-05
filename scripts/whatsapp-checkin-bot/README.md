# WhatsApp check-in bot

At 1:00 PM and 6:00 PM it checks which WhatsApp groups had a message today. It then ticks every active client whose name is in one of those group names on **Daily Check-In**. It only ticks clients and never unticks them.

It runs on the office Mac with the WhatsApp desktop app. It reads only group names and last-message times from WhatsApp's local database, in read-only mode. No message contents leave the Mac, and it never sends or clicks anything in WhatsApp.

## One-time setup

1. **Create a secret token.** Run `openssl rand -hex 24` and copy the output.
2. **Railway.** Add the variable `CHECKIN_BOT_TOKEN` with that value, then redeploy.
3. **Mac.** Run `cp .env.example .env` in this folder. Fill in `DASHBOARD_URL` (the live dashboard address) and the same token.
4. **Install the schedule.** Run `./install.sh`.
5. **Full Disk Access.** Add the `node` path printed by `install.sh` under System Settings > Privacy & Security > Full Disk Access. macOS blocks reading WhatsApp's data without this.

## Test it

```bash
node checkin.mjs --dry-run --no-wait   # shows today's groups and who would be ticked, changes nothing
node checkin.mjs --no-wait             # ticks for real
```

To check the schedule, run `launchctl list | grep divadaulti`. The log is at `~/Library/Logs/divadaulti-checkin-bot.log`.

## Matching rule

A client matches when their name appears as whole words in the group name, ignoring case and punctuation. For example, client "Salaya Vritika" matches the group "Salaya Vritika x Diva Daulti". Client names shorter than 3 characters are skipped. If a client's group is named differently, rename the group so it contains the client name.

## Uninstall

```bash
launchctl bootout gui/$(id -u)/com.divadaulti.whatsapp-checkin
rm ~/Library/LaunchAgents/com.divadaulti.whatsapp-checkin.plist
```
