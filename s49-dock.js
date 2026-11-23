/* s49 dock-only hand-like: street north, river road east, onto the quay. no testfast/jump. */
const {chromium}=require('/workspace/p32work/pwtools/node_modules/playwright-core');
const fs=require('fs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://127.0.0.1:8765/';
const SHOT=process.env.SHOT||'/workspace/looks/e/shots/s37/s49-handlike';
const LIVE=process.env.LIVE||'/workspace/p32work/spark37/proof-logs/s49-dock-live.log';
const {pathToFileURL}=require('url');
// reuse helpers by evaluating the same enter path — copy minimal from s49-handlike via vm is messy; require by extracting is not. Inline slim.
