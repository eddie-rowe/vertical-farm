"use server";

import webPush from "web-push";

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    "mailto:support@goodgoodgreens.org",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  urgent?: boolean;
  data?: Record<string, any>;
}

/**
 * Subscribe a user to push notifications
 */
export async function subscribeToPushNotifications(
  subscription: PushSubscription,
  userId?: string,
) {
  try {
    // TODO: Store subscription in database with user ID
    // For now, we'll just validate the subscription
    if (
      !subscription.endpoint ||
      !subscription.keys.p256dh ||
      !subscription.keys.auth
    ) {
      throw new Error("Invalid subscription object");
    }

    console.log("Push subscription stored for user:", userId);

    // Send welcome notification
    await sendPushNotification(subscription, {
      title: "Welcome to Vertical Farm Alerts!",
      body: "You'll now receive important notifications about your farm.",
      icon: "/android-chrome-192x192.png",
      tag: "welcome",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to subscribe to push notifications:", error);
    return { success: false, error: "Failed to subscribe to notifications" };
  }
}

/**
 * Unsubscribe a user from push notifications
 */
export async function unsubscribeFromPushNotifications(
  subscription: PushSubscription,
  userId?: string,
) {
  try {
    // TODO: Remove subscription from database
    console.log("Push subscription removed for user:", userId);
    return { success: true };
  } catch (error) {
    console.error("Failed to unsubscribe from push notifications:", error);
    return {
      success: false,
      error: "Failed to unsubscribe from notifications",
    };
  }
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
) {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      throw new Error("VAPID keys not configured");
    }

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/android-chrome-192x192.png",
      badge: payload.badge || "/favicon-32x32.png",
      tag: payload.tag || "farm-notification",
      data: {
        url: payload.url || "/",
        timestamp: Date.now(),
        ...payload.data,
      },
      urgent: payload.urgent || false,
    });

    await webPush.sendNotification(subscription, notificationPayload);
    console.log("Push notification sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error: "Failed to send notification" };
  }
}

/**
 * Send notifications to all subscribed users
 */
export async function broadcastNotification(payload: NotificationPayload) {
  try {
    // TODO: Get all subscriptions from database
    const subscriptions: PushSubscription[] = [];

    const results = await Promise.allSettled(
      subscriptions.map((subscription) =>
        sendPushNotification(subscription, payload),
      ),
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    ).length;

    console.log(
      `Broadcast notification sent to ${successful}/${subscriptions.length} subscribers`,
    );

    return {
      success: true,
      sent: successful,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error("Failed to broadcast notification:", error);
    return { success: false, error: "Failed to broadcast notification" };
  }
}

/**
 * Send farm-specific alert notifications
 */
export async function sendFarmAlert(
  alertType: "critical" | "warning" | "info",
  message: string,
  details?: {
    sensorId?: string;
    value?: number;
    threshold?: number;
    url?: string;
  },
) {
  const alertConfig = {
    critical: {
      title: "🚨 Critical Farm Alert",
      urgent: true,
      tag: "critical-alert",
    },
    warning: {
      title: "⚠️ Farm Warning",
      urgent: false,
      tag: "warning-alert",
    },
    info: {
      title: "📊 Farm Update",
      urgent: false,
      tag: "info-alert",
    },
  };

  const config = alertConfig[alertType];

  return await broadcastNotification({
    title: config.title,
    body: message,
    tag: config.tag,
    urgent: config.urgent,
    url: details?.url || "/dashboard",
    data: {
      alertType,
      sensorId: details?.sensorId,
      value: details?.value,
      threshold: details?.threshold,
    },
  });
}

/**
 * Get VAPID public key for client-side subscription
 */
export async function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}
