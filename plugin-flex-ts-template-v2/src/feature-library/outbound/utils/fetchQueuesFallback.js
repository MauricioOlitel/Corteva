import { Manager } from '@twilio/flex-ui';

const manager = Manager.getInstance();

const resolveDomain = () => {
  let dom = process?.env?.FLEX_APP_TWILIO_SERVERLESS_DOMAIN;
  if (!dom || dom === 'undefined') dom = window.__SERVERLESS_DOMAIN__ || '';
  if (!dom) dom = 'https://outbound-messaging-6982-dev.twil.io';
  if (!/^https?:\/\//i.test(dom)) dom = 'https://' + dom;
  return dom.replace(/\/$/, '');
};

export const fetchQueuesFallback = async () => {
  const token = manager.store.getState().flex.session?.ssoTokenPayload?.token;
  if (!token) return [];
  // Use GET with query param to avoid Content-Type issues (415) some runtimes show with POST
  // Try to obtain workspace SID from service configuration to pass explicitly (helps when Function env lacks it)
  let workspaceSid = undefined;
  try {
    workspaceSid = manager?.serviceConfiguration?.taskrouter_workspace_sid || manager?.store?.getState()?.flex?.config?.taskrouter_workspace_sid;
  } catch (_) {}
  const url = `${resolveDomain()}/listQueues?Token=${encodeURIComponent(token)}${workspaceSid ? `&workspaceSid=${encodeURIComponent(workspaceSid)}` : ''}&ts=${Date.now()}`;
  try {
    console.log('[fetchQueuesFallback] GET', url);
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    if (!resp.ok) {
      console.error('[fetchQueuesFallback] HTTP', resp.status, resp.statusText);
      return [];
    }
    const data = await resp.json();
    return data.queues || [];
  } catch (e) {
    console.error('[fetchQueuesFallback] erro', e);
    return [];
  }
};
