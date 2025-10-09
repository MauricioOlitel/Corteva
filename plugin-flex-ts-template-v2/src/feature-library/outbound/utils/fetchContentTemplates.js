import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

// Shared resolver (duplicated also in sendOutboundMessage; can be refactored later)
const resolveServerlessDomain = () => {
  const envDomain = typeof process !== 'undefined' && process.env
    ? process.env.FLEX_APP_TWILIO_SERVERLESS_DOMAIN
    : undefined;
  const windowDomain = typeof window !== 'undefined' ? window.__SERVERLESS_DOMAIN__ : undefined;
  let dom = envDomain && envDomain !== 'undefined' ? envDomain : undefined;

  if (!dom && windowDomain && windowDomain !== 'undefined') {
    dom = windowDomain;
  }

  if (!dom) {
    console.error('[fetchContentTemplates] Nenhum domínio serverless configurado. Defina FLEX_APP_TWILIO_SERVERLESS_DOMAIN.');
    throw new Error('FLEX_APP_TWILIO_SERVERLESS_DOMAIN não configurado');
  }

  dom = dom.trim();
  if (!/^https?:\/\//i.test(dom)) {
    dom = 'https://' + dom.replace(/^\/*/, '');
  }
  dom = dom.replace(/\/$/, '');

  try {
    console.debug('[fetchContentTemplates] resolveServerlessDomain', {
      envDomain,
      windowDomain,
      finalDomain: dom,
    });
  } catch (e) {
    // ignore logging errors (e.g., unavailable console in certain envs)
  }

  return dom;
};

export const fetchContentTemplates = async () => {
  const token = manager.store.getState().flex.session?.ssoTokenPayload?.token;
  if (!token) {
    console.warn('[fetchContentTemplates] Sem token SSO, abortando.');
    return [];
  }

  let tokenClaims;
  try {
    const [, payload] = token.split('.') || [];
    if (payload && typeof atob === 'function') {
      tokenClaims = JSON.parse(atob(payload));
    }
  } catch (err) {
    console.warn('[fetchContentTemplates] Falha ao decodificar token JWT', err);
  }

  const domain = resolveServerlessDomain();
  const url = `${domain}/getContentTemplates`;
  const tokenPreview = `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
  console.debug('[fetchContentTemplates] Fetch URL & token preview:', {
    url,
    tokenPreview,
    tokenClaims: tokenClaims
      ? {
          iss: tokenClaims.iss,
          sub: tokenClaims.sub,
          identity: tokenClaims.grants?.identity,
          workerSid: tokenClaims.grants?.worker_sid,
          accountSid: tokenClaims.grants?.flex?.service_configuration?.account_sid,
          exp: tokenClaims.exp,
        }
      : 'unavailable',
  });

  const options = {
    method: 'POST',
    body: new URLSearchParams({ Token: token }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  };
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) {
      let extra = '';
      try { extra = await resp.text(); } catch {}
      console.error('[fetchContentTemplates] HTTP', resp.status, resp.statusText, extra || '');
      return [];
    }
    const data = await resp.json();
    return data.templates || [];
  } catch (e) {
    console.error('[fetchContentTemplates] Erro:', e);
    return [];
  }
};

try {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, '__fetchContentTemplatesDebug', {
      value: fetchContentTemplates,
      writable: false,
      configurable: true,
    });
  }
} catch (e) {
  // ignore errors ao expor helper global
}
