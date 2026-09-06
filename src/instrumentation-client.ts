// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// 로컬 개발 / QA(NEXT_PUBLIC_IS_DEV=true)에서 클라이언트(브라우저) Sentry 보고 비활성화
const sentryEnabled = !(
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "test" ||
  process.env.NEXT_PUBLIC_IS_DEV === "true"
);

Sentry.init({
  dsn: "https://07477ebb0c99ae821f2fbbe082e6b632@o4503924886405120.ingest.us.sentry.io/4511840127877120",

  enabled: sentryEnabled,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
