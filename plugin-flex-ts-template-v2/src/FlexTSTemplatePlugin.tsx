import * as Flex from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';

import { initFeatures } from './utils/feature-loader';

const PLUGIN_NAME = 'FlexTSTemplatePlugin';

export default class FlexTSTemplatePlugin extends FlexPlugin {
  // eslint-disable-next-line no-restricted-syntax
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof Flex }
   * @param manager { Flex.Manager }
   */
  init(flex: typeof Flex, manager: Flex.Manager) {
    // Expor domínio serverless para depuração sem depender de `process` no console
    try {
      const domain = (process && (process as any).env && (process as any).env.FLEX_APP_TWILIO_SERVERLESS_DOMAIN) || '';
      if (typeof window !== 'undefined') {
        (window as any).__SERVERLESS_DOMAIN__ = domain;
        (window as any).__getServerlessDomain = () => (process && (process as any).env && (process as any).env.FLEX_APP_TWILIO_SERVERLESS_DOMAIN) || (window as any).__SERVERLESS_DOMAIN__ || '';
        // Log inicial
        // eslint-disable-next-line no-console
        console.log('[FlexPlugin] Serverless domain (build-time):', domain);
      }
    } catch {
      // ignore
    }
    initFeatures(flex, manager);
  }
}
