# acc2 — Spark accounts: kid profiles + PIN + progress (started 8:22 AM ET Nov 21)
Base: copy of /workspace/p32work/spark37 (preview 96uv5n412 / dpl_6WdeHPsZXAyrdxqTXqfMC6oxUgR3), excl proof-logs. Preview only.
- 8:5x AM: built spark-accounts.js v3 (family accounts, preview-only via /api/accounts-config), api/kid-token.js (kid-scoped 2-min JWT, HS256 legacy secret accepted by project), Ava clip "Who's playing? Tap your picture!", follow-up SQL supabase/migrations/20261121090000_spark_accounts_followup.sql (NOT applied; Allen pastes).
- Local E2E 390 (dev server :8931, harness /workspace/p32work/acc2-work/acc2-test.js): 34/35 then harness fix. API checks 13/13 (api-test.py). Test families: spark-test-fam{1,2}.acc2@example.com (creds in /workspace/p32work/acc2-secrets, chmod 600).
- Deploying preview from acc2 (project.json verified).
- ~9:05 AM: preview 88y48url9 (dpl_GS4XTGXHdRy7bUvafR6ZTQWyxcjK) had a pad double-tap debounce bug (same key twice dropped with mouse); fixed -> preview lds31s325 / dpl_GoKfv8wjJFMqCqfiwcvGfd1b83j7. Full rerun all 5 viewports + extra.
- 9:12 AM: runall.sh (acc2-work) running against lds31s325: 5 viewports -> api-test.py -> extra-test.js; log acc2-work/runall.log, shots acc2-work/shots/<vp>/. RESUME: if interrupted, check runall.log; rerun `setsid nohup ./runall.sh` from acc2-work if dead.
- After verify: delete 88y48url9 (own superseded) + 6onv1nfbw (oldest). KEEP 96uv5n412, o4py2vj12, lds31s325. Then cleanup test data (reset.py; delete test users optional) and report.
- Allen 9:12: Egypt frame-rate changes ON HOLD; acc2 touches no LOD/wheat/geometry/quality (only spark-accounts.js, api/accounts-config.js, api/kid-token.js, index.html cache bumps, voice index + 1 clip, supabase/ SQL).
- 10:0x: all viewports pass except p1280 harness race (fixed waitPlaying) + extra fam2 consent click; rerun.sh running (rerun.log).
- 10:03: rerun all PASS (p1280 35/35, api 13/13, extra 9/9). Deleting 88y48url9 + 6onv1nfbw.
- 10:05 AM: DONE. Deleted 6onv1nfbw (dpl_7Vx6...) + 88y48url9 (dpl_GS4X...). Previews now 3: lds31s325, 96uv5n412, o4py2vj12. Prod dpu3ow9ne untouched.
- Test data cleaned: both test users (spark-test-fam{1,2}.acc2@example.com) deleted -> Preview Supabase back to 0 users/parents/kids/progress (as found). Follow-up SQL NOT applied.
- Results: p390 35/35, p1280 35/35, fire-800x1280 35/35, fire-1280x800 35/35, fire-600x960(DPR1.33) 35/35, api 13/13, extra 9/9. Shots: /workspace/p32work/acc2-work/shots/<vp>/NN-step.png + report.json.
- Known cosmetic: top-bar Family button hangs slightly below the bar at 600 wide (inherits .tools button style).

## Nov 21 11:40 AM — acc3: accounts-only preview on PRODUCTION source (dpu3ow9ne). No preview deletions (Allen 11:39). Work dir /workspace/p32work/acc3.

## Nov 21 6:40 PM — required sign-in on first load (Allen 6:38 PM). Source = acc2 in place (no copy, no branches; acc3 from 11:40 AM is abandoned/never deployed).
- spark-accounts.js v5: accounts on + no session -> requireSignIn() (no Back/close/guest); expired/unusable session at boot or mid-play -> sign-in again; family-load-error "Back to playing" -> "Try again". index.html spark-accounts.js?v=5. Backup acc2-work/spark-accounts.v4.bak.js.
- Baseline Preview Supabase users before tests: 0 (acc2-work/baseline-users.json).
- 6:5x PM: test users recreated (mkusers.py) for runs; rmusers.py deletes them. Local smoke 390 running (run-local-390-v5.log).
- 6:48 PM: deployed ONE preview 3pkrt21wu / dpl_FyGwhhEZ8ccRwYspyDxUgLAcGMeh (target preview). Running run3.sh (run3.log).
- 7:15 PM: VERIFIED 3pkrt21wu: p390 37/37, p1280 37/37, fire-800x1280 37/37, api 13/13, extra 7/7 (no-session gate can't be dismissed at 390/1280; expired session -> sign-in again; prod-mode off; 2nd family isolated; 5-kid cap). Shots acc2-work/shots/{p390,p1280,fire-800x1280,extra}/ (first screen = 01-first-screen-signin.png). Old lds31s325 shots moved to acc2-work/old2/.
- Test users deleted (rmusers.py): Supabase users 0 = baseline; parents/kids/progress 0.
- Share link (14 days, expires Sat Dec 5 2026 7:15 PM ET): https://spark-studio-3pkrt21wu-ruhf.vercel.app/?_vercel_share=LRzRbFf1wejhce8LcbIC6hQOUlVAn3GJ
- Deleted o4py2vj12 (dpl_HCAhj6hRwFEJ4kPHrwBpZoLgraDK) only. Previews now: 3pkrt21wu, lds31s325, 96uv5n412. Prod dpu3ow9ne untouched.
- NOTE: /workspace/p32work/acc3 (11:40 AM copy of prod source) is abandoned, never deployed; can be deleted.

## Nov 21 8:30 PM — 6-tile younger-kid code pad (Allen 8:24 PM). acc2 in place.
- spark-accounts.js v6: shapes pad = 6 tiles (c1 red circle, s2 blue square, t3 green triangle, h4 yellow heart, c2 purple star, s3 orange moon), 3x2 grid, 4-tap code. Keys fit server regex ^([csth][1-4]){4}$ -> NO SQL change. Number pad unchanged. Backup acc2-work/spark-accounts.v5.bak.js.
- Baseline users 0; test users recreated (mkusers.py) -> delete with rmusers.py. Old 3pkrt21wu shots in acc2-work/old3/. Local smoke 390 running.
