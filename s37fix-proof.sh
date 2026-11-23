#!/bin/sh
set -e
cd /workspace/p32work/spark37
export BASE=https://spark-studio-pwk6un865-ruhf.vercel.app/
echo "PROOF START $(date -R) $BASE" >> /tmp/s37fix-proof-live.log
vercel env run --scope ruhf -- node s37step-clear.js >> /tmp/s37fix-proof-live.log 2>&1
CLEAR=$(node -e 'try{const r=require("/tmp/s37step-clear-report.json");console.log(r.clear?"yes":"no")}catch(e){console.log("err")}')
echo "CLEARANCE $CLEAR $(date -R)" >> /tmp/s37fix-proof-live.log
if [ "$CLEAR" != "yes" ]; then
  echo "STOP: stall still present; not starting official P1-P10" >> /tmp/s37fix-proof-live.log
  exit 2
fi
export LIVE=/tmp/s37hand7-live.log
export REPORT=/tmp/s37hand7-report.json
export SHOT=/workspace/looks/e/shots/s37/reprove-pwk6un865
echo "OFFICIAL START $(date -R)" >> /tmp/s37fix-proof-live.log
vercel env run --scope ruhf -- node s37reprove.js >> /tmp/s37fix-proof-live.log 2>&1
echo "OFFICIAL DONE $(date -R) exit=$?" >> /tmp/s37fix-proof-live.log
