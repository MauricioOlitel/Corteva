import { Notifications, NotificationType } from "@twilio/flex-ui";

const registerOutboundMessageFailed = (manager) => {
  try {
    manager.strings.outboundMessageFailed =
      'Outbound Message failed: "{{message}}"';
    Notifications.registerNotification({
      id: "outboundMessageFailed",
      content: "outboundMessageFailed", // template
      closeButton: false,
      timeout: 6000,
      type: NotificationType.error,
    });
  } catch (error) {
    // Notification already registered by another plugin (e.g., outbound-cbm)
    console.warn('[outbound] outboundMessageFailed notification already registered, skipping');
  }
};

const registerOutboundMessageSent = (manager) => {
  try {
    manager.strings.outboundMessageSent = 'Message sent to "{{message}}"';
    Notifications.registerNotification({
      id: "outboundMessageSent",
      content: "outboundMessageSent", // template
      timeout: 3000,
      type: NotificationType.info,
    });
  } catch (error) {
    // Notification already registered by another plugin (e.g., outbound-cbm)
    console.warn('[outbound] outboundMessageSent notification already registered, skipping');
  }
};

const registerNotifications = (manager) => {
  registerOutboundMessageFailed(manager);
  registerOutboundMessageSent(manager);
};

export default registerNotifications;
