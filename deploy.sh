#!/bin/sh
# 部署：蓋上新版本號 → 上傳 Firebase → 推到 GitHub
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M%S)
sed -i '' "s/^const APP_V='[^']*';/const APP_V='$V';/" index.html
printf '{"v":"%s"}\n' "$V" > version.json
npx -y firebase-tools@13 deploy --only hosting --non-interactive 2>&1 | grep -E "Deploy complete|Error"
git add -A && git commit -qm "${1:-更新} (v$V)" && git push -q
echo "deployed v$V"
