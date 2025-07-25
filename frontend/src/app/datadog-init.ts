// Datadog RUM initialization for Next.js frontend
// Necessary if using App Router to ensure this file runs on the client
"use client";

import { datadogRum } from "@datadog/browser-rum";

datadogRum.init({
  applicationId: "84186dc8-ba0e-458c-a3a4-adc3e2c5cf7d",
  clientToken: "pubce77340ae412427bedea62c99ae17003",
  // `site` refers to the Datadog site parameter of your organization
  // see https://docs.datadoghq.com/getting_started/site/
  site: "us5.datadoghq.com",
  service: "vertical-farm-frontend",
  env: "dev",
  version: "1.0.0",
  sessionSampleRate: 100,
  sessionReplaySampleRate: 100,
  trackResources: true,
  trackLongTasks: true,
  trackUserInteractions: true,
  defaultPrivacyLevel: "mask-user-input",
  // Specify URLs to propagate trace headers for connection between RUM and backend trace
  allowedTracingUrls: [
    {
      match: "https://vertical-farm-api.goodgoodgreens.org",
      propagatorTypes: ["tracecontext"],
    },
  ],
});

export default function DatadogInit() {
  // Render nothing - this component is only included so that the init code
  // above will run client-side
  return null;
}
