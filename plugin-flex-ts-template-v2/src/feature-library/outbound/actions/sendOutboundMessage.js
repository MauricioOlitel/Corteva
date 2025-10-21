import { Actions, Manager, Notifications } from "@twilio/flex-ui";
const manager = Manager.getInstance();

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
    console.error('[sendOutboundMessage] Nenhum domínio serverless configurado. Defina FLEX_APP_TWILIO_SERVERLESS_DOMAIN.');
    throw new Error('FLEX_APP_TWILIO_SERVERLESS_DOMAIN não configurado');
  }

  dom = dom.trim();
  if (!/^https?:\/\//i.test(dom)) dom = 'https://' + dom.replace(/^\/*/, '');
  dom = dom.replace(/\/$/, '');

  try {
    console.debug('[sendOutboundMessage] resolveServerlessDomain', {
      envDomain,
      windowDomain,
      finalDomain: dom,
    });
  } catch (e) {
    // ignore logging errors
  }

  return dom;
};

const sendOutboundMessage = async (sendOutboundParams) => {
  const body = {
    ...sendOutboundParams,
    Token: manager.store.getState().flex.session.ssoTokenPayload.token,
  };
  if (body.ContentTemplateSid) {
    delete body.body;
  }

  const options = {
    method: "POST",
    body: new URLSearchParams(body),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  };

  const { OpenChatFlag, To } = sendOutboundParams;

  try {
  const domain = resolveServerlessDomain();
  const url = `${domain}/sendOutboundMessage`;
  const token = body.Token || '';
  const tokenPreview = token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : 'n/a';
  console.debug('[sendOutboundMessage] Request info', {
    url,
    openChat: !!OpenChatFlag,
    to: To,
    tokenPreview,
  });
  const resp = await fetch(url, options);
    const data = await resp.json();

    if (!OpenChatFlag && data.success) {
      Notifications.showNotification("outboundMessageSent", {
        message: To,
      });
    }

    if (!data.success) {
      Notifications.showNotification("outboundMessageFailed", {
        message: data.errorMessage,
      });
    }
  } catch (error) {
    console.error(error);
    Notifications.showNotification("outboundMessageFailed", {
      message: "Error calling sendOutboundMessage function",
    });
  }
};

// TODO - fallback and try and use outbound calling setup sids
// TODO - allow override of queue from action payload
try {
  Actions.registerAction("SendOutboundMessage", (payload) => {
    if (!payload.callerId)
      payload.callerId = process.env.FLEX_APP_TWILIO_FROM_NUMBER;

    if (payload.openChat) {
      // create a task immediately
    const sendOutboundParams = {
      OpenChatFlag: true,
      KnownAgentRoutingFlag: false,
      To: payload.destination,
      From: payload.callerId,
      Body: payload.body,
      ContentTemplateSid: payload.contentTemplateSid,
      WorkerSid: manager.workerClient.sid,
      WorkerFriendlyName: manager.user.identity,
      WorkspaceSid: process.env.FLEX_APP_WORKSPACE_SID,
      WorkflowSid: process.env.FLEX_APP_WORKFLOW_SID,
      QueueSid: payload.queueSid || process.env.FLEX_APP_QUEUE_SID || '',
      InboundStudioFlow: process.env.FLEX_APP_INBOUND_STUDIO_FLOW,
    };
    sendOutboundMessage(sendOutboundParams);
  } else {
    // send message and inbound triggers studio flow. optional known agent routing
    const sendOutboundParams = {
      OpenChatFlag: false,
      KnownAgentRoutingFlag: !!payload.routeToMe,
      To: payload.destination,
      From: payload.callerId,
      Body: payload.body,
      ContentTemplateSid: payload.contentTemplateSid,
      WorkerSid: manager.workerClient.sid,
      WorkerFriendlyName: manager.user.identity,
      WorkspaceSid: process.env.FLEX_APP_WORKSPACE_SID, // we need this to lookup task if there is a active conversation already
      WorkflowSid: "",
      QueueSid: payload.queueSid || '',
      InboundStudioFlow: process.env.FLEX_APP_INBOUND_STUDIO_FLOW,
    };
    sendOutboundMessage(sendOutboundParams);
  }
  });
} catch (error) {
  // Action already registered by another plugin (e.g., outbound-cbm)
  console.warn('[outbound] SendOutboundMessage action already registered, skipping');
}
