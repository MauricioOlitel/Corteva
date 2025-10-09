import './actions/sendOutboundMessage';
import registerNotifications from './utils/notifications';
import { Manager } from '@twilio/flex-ui';
import { FeatureDefinition } from '../../types/feature-loader';

// Não há diretório flex-hooks para outbound no momento; retornamos hooks vazios
export const register = (): FeatureDefinition => {
  const manager = Manager.getInstance?.();
  if (manager) {
    registerNotifications(manager);
  }
  return { name: 'outbound', hooks: [] };
};
