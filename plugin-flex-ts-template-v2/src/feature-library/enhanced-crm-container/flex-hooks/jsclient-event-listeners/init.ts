import { FlexJsClient } from '../../../../types/feature-loader';
import { registerLoadCRMContainerTabsAction } from '../custom-action/loadCRMContainerTabs';

export const clientName = FlexJsClient.FlexClient;
export const eventName = 'init';
export const jsClientHook = function registerCRMActionEarly() {
  console.log('[enhanced-crm-container] Registering LoadCRMContainerTabs action during init');
  registerLoadCRMContainerTabsAction();
};
