#!/bin/sh
# 部署：蓋上新版本號 → 上傳 Firebase → 推到 GitHub
set -e
cd "$(dirname "$0")"
# 先檢查 JS 語法，有錯就不部署
node -e "const s=require('fs').readFileSync('index.html','utf8');const re=/<script>([\\s\\S]*?)<\\/script>/g;let m;while((m=re.exec(s)))new Function(m[1]);global.window={};require('./exdata.js')" 2>&1 | tail -3 || { echo "JS 語法錯誤，取消部署"; exit 1; }
V=$(date +%Y%m%d%H%M%S)
sed -i '' "s/^const APP_V='[^']*';/const APP_V='$V';/" index.html
printf '{"v":"%s"}\n' "$V" > version.json
npx -y firebase-tools@13 deploy --only hosting --non-interactive 2>&1 | grep -E "Deploy complete|Error"
git add -A && git commit -qm "${1:-更新} (v$V)" && git push -q
echo "deployed v$V"
