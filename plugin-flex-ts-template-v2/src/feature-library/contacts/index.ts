import { FeatureDefinition } from '../../types/feature-loader';
import { isFeatureEnabled } from './config';
// @ts-ignore
const requireHook = require.context('./flex-hooks', true, /\.[jt]sx?$/);

const hooks = requireHook.keys().map(requireHook);

export const register = (): FeatureDefinition => {
  if (!isFeatureEnabled()) return {};
  return { name: 'contacts', hooks };
};
