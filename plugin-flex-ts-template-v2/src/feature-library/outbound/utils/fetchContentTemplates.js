import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

// Shared resolver (duplicated also in sendOutboundMessage; can be refactored later)
const resolveServerlessDomain = () => {
  let dom = process?.env?.FLEX_APP_TWILIO_SERVERLESS_DOMAIN;
  // Guard against literal 'undefined' string produced at build when env missing
  if (!dom || dom === 'undefined') {
    if (typeof window !== 'undefined' && window.__SERVERLESS_DOMAIN__) {
      dom = window.__SERVERLESS_DOMAIN__;
    }
  }
  // Hard fallback (DEV) – dominio fornecido
  if (!dom || dom === 'undefined') {
    dom = 'https://outbound-messaging-6982-dev.twil.io';
  }
  dom = dom.trim();
  if (!/^https?:\/\//i.test(dom)) {
    dom = 'https://' + dom.replace(/^\/*/, '');
  }
  return dom.replace(/\/$/, '');
};

export const fetchContentTemplates = async () => {
  const token = manager.store.getState().flex.session?.ssoTokenPayload?.token;
  if (!token) {
    console.warn('[fetchContentTemplates] Sem token SSO, abortando.');
    return [];
  }
  const domain = resolveServerlessDomain();
  const url = `${domain}/getContentTemplates`;
  console.debug('[fetchContentTemplates] Fetch URL:', url);

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
