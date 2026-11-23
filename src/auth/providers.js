/* spark37 item 11 — dormant Google / Apple sign-in stubs.
   No live services, no credentials, no OAuth, no network. Handlers always
   return { ok:false, reason:"not configured" } and do nothing else.
   Buttons are not mounted unless a provider has enabled:true. */
(function (w) {
  "use strict";
  if (w.SparkAuth) return;

  var DEFAULTS = {
    google: { enabled: false, clientId: "" },
    apple: { enabled: false, serviceId: "", redirectUri: "" }
  };

  if (!w.SPARK_AUTH_PROVIDERS || typeof w.SPARK_AUTH_PROVIDERS !== "object") {
    w.SPARK_AUTH_PROVIDERS = {
      google: { enabled: false, clientId: "" },
      apple: { enabled: false, serviceId: "", redirectUri: "" }
    };
  } else {
    var g = w.SPARK_AUTH_PROVIDERS.google || {};
    var a = w.SPARK_AUTH_PROVIDERS.apple || {};
    w.SPARK_AUTH_PROVIDERS.google = {
      enabled: g.enabled === true,
      clientId: typeof g.clientId === "string" ? g.clientId : ""
    };
    w.SPARK_AUTH_PROVIDERS.apple = {
      enabled: a.enabled === true,
      serviceId: typeof a.serviceId === "string" ? a.serviceId : "",
      redirectUri: typeof a.redirectUri === "string" ? a.redirectUri : ""
    };
  }

  function providers() {
    return w.SPARK_AUTH_PROVIDERS || DEFAULTS;
  }

  function isEnabled(name) {
    var p = providers()[name];
    return !!(p && p.enabled === true);
  }

  function notConfigured(provider) {
    return { ok: false, reason: "not configured", provider: provider };
  }

  /* Always dormant: no SDK load, no redirect, no fetch, no storage writes. */
  function signInWithGoogle() {
    return Promise.resolve(notConfigured("google"));
  }

  function signInWithApple() {
    return Promise.resolve(notConfigured("apple"));
  }

  function handleAuthCallback() {
    return Promise.resolve(notConfigured("callback"));
  }

  function signOut() {
    return Promise.resolve(notConfigured("signOut"));
  }

  function makeButton(provider, label) {
    var btn = w.document.createElement("button");
    btn.type = "button";
    btn.className = "spark-auth-btn spark-auth-btn--" + provider;
    btn.setAttribute("data-spark-auth", provider);
    btn.setAttribute("aria-label", label);
    btn.textContent = label;
    if (!isEnabled(provider)) {
      btn.hidden = true;
      btn.classList.add("spark-auth-dormant");
      btn.setAttribute("aria-hidden", "true");
    }
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (provider === "google") signInWithGoogle();
      else if (provider === "apple") signInWithApple();
    });
    return btn;
  }

  function continueWithGoogle() {
    return makeButton("google", "Continue with Google");
  }

  function continueWithApple() {
    return makeButton("apple", "Continue with Apple");
  }

  /* Mount onto a future parent sign-in screen only when that provider is enabled.
     With the default config (enabled:false) this is a no-op and kids never see the buttons. */
  function mount(parent) {
    if (!parent || !parent.appendChild) return [];
    var out = [];
    if (isEnabled("google")) {
      var gBtn = continueWithGoogle();
      gBtn.hidden = false;
      gBtn.classList.remove("spark-auth-dormant");
      gBtn.removeAttribute("aria-hidden");
      parent.appendChild(gBtn);
      out.push(gBtn);
    }
    if (isEnabled("apple")) {
      var aBtn = continueWithApple();
      aBtn.hidden = false;
      aBtn.classList.remove("spark-auth-dormant");
      aBtn.removeAttribute("aria-hidden");
      parent.appendChild(aBtn);
      out.push(aBtn);
    }
    return out;
  }

  /* Init never calls mount(). Buttons stay unmounted and hidden unless a later parent
     screen passes enabled:true. This file must not touch Supabase or spark-accounts.js. */
  w.SparkAuth = {
    signInWithGoogle: signInWithGoogle,
    signInWithApple: signInWithApple,
    handleAuthCallback: handleAuthCallback,
    signOut: signOut,
    continueWithGoogle: continueWithGoogle,
    continueWithApple: continueWithApple,
    mount: mount,
    isEnabled: isEnabled
  };
})(window);
