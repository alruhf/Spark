# Spark auth stubs (dormant)

These files are structured placeholders for a future grown-up sign-in screen.
They ship disabled. There are no live services, no credentials, no OAuth
calls, and no network requests. `spark-accounts.js` and Supabase are not
touched by this module.

## Config slot

Set (or leave) this on the page before `providers.js` runs:

```js
window.SPARK_AUTH_PROVIDERS = {
  google: { enabled: false, clientId: "" },
  apple: { enabled: false, serviceId: "", redirectUri: "" }
};
```

Both providers stay at `enabled: false` in this build. Buttons are not
mounted unless `enabled` is `true`, so kids never see them.

## Handlers

`SparkAuth.signInWithGoogle()`, `signInWithApple()`, `handleAuthCallback()`,
and `signOut()` each resolve to `{ ok: false, reason: "not configured" }`
and do nothing else.

Button factories: `SparkAuth.continueWithGoogle()`, `continueWithApple()`.
`SparkAuth.mount(parentEl)` appends a button only when that provider is
enabled.

## TODO — what to wire later

1. **Supabase provider settings** — turn on Google and Apple in the
   Supabase Auth providers panel (callback URLs, no secrets in the
   client). Do not enable anything in this stub module until that is
   ready. Leave `spark-accounts.js` as the accounts client.

2. **Google OAuth client** — create a Web application OAuth 2.0 client
   in Google Cloud, add the authorized JavaScript origins and redirect
   URIs, then put the client ID in `SPARK_AUTH_PROVIDERS.google.clientId`
   and set `enabled: true` only after the real sign-in flow is written.

3. **Apple service ID / key** — create a Services ID and a Sign in with
   Apple key in the Apple Developer account, set the return URL, then
   fill `serviceId` and `redirectUri` and set `enabled: true` only after
   the real sign-in flow is written.

Until those are wired, keep `enabled: false`. The game must stay
unchanged.
