import { Actions } from '@twilio/flex-ui';

let actionRegistered = false;

export const registerLoadCRMContainerTabsAction = () => {
  // Prevent duplicate registration
  if (actionRegistered) {
    console.log('[enhanced-crm-container] LoadCRMContainerTabs action already registered, skipping');
    return;
  }
  
  try {
    Actions.registerAction('LoadCRMContainerTabs', async () => {
      // Do nothing! The TabbedCRMTask component adds a listener to afterLoadCRMContainerTabs to handle the payload.
    });
    actionRegistered = true;
    console.log('[enhanced-crm-container] LoadCRMContainerTabs action registered successfully');
  } catch (error) {
    console.error('[enhanced-crm-container] Failed to register LoadCRMContainerTabs action:', error);
  }
};
