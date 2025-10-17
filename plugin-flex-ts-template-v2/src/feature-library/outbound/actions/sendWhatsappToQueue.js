import { Actions, Manager, Notifications } from "@twilio/flex-ui";
const manager = Manager.getInstance();

/**
 * Resolve serverless domain from environment or window object
 * @returns {string} The serverless domain URL
 */
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
    console.error('[sendWhatsappToQueue] Nenhum domínio serverless configurado. Defina FLEX_APP_TWILIO_SERVERLESS_DOMAIN.');
    throw new Error('FLEX_APP_TWILIO_SERVERLESS_DOMAIN não configurado');
  }

  dom = dom.trim();
  if (!/^https?:\/\//i.test(dom)) dom = 'https://' + dom.replace(/^\/*/, '');
  dom = dom.replace(/\/$/, '');

  console.debug('[sendWhatsappToQueue] resolveServerlessDomain', {
    envDomain,
    windowDomain,
    finalDomain: dom,
  });

  return dom;
};

/**
 * Send WhatsApp message to a specific queue
 * @param {Object} params - Send parameters
 * @param {string} params.to - Destination phone number
 * @param {string} params.from - Twilio WhatsApp number
 * @param {string} params.queueSid - Queue SID to route the task
 * @param {string} [params.contentTemplateSid] - Content template SID
 * @param {string} [params.body] - Message body (if no template)
 * @param {boolean} [params.openChatFlag] - Create task immediately
 * @param {number} [params.priority] - Task priority
 * @param {number} [params.timeout] - Task timeout in seconds
 */
const sendWhatsappToQueue = async (params) => {
  const {
    to,
    from,
    queueSid,
    contentTemplateSid,
    body,
    openChatFlag = true,
    priority = 0,
    timeout = 86400,
  } = params;

  // Validate required parameters
  if (!to) {
    console.error('[sendWhatsappToQueue] Missing required parameter: to');
    Notifications.showNotification("outboundMessageFailed", {
      message: "Número de destino não fornecido",
    });
    return { success: false, error: 'Missing destination number' };
  }

  if (!queueSid) {
    console.error('[sendWhatsappToQueue] Missing required parameter: queueSid');
    Notifications.showNotification("outboundMessageFailed", {
      message: "Fila não selecionada",
    });
    return { success: false, error: 'Missing queue SID' };
  }

  if (!contentTemplateSid && !body) {
    console.error('[sendWhatsappToQueue] Must provide either contentTemplateSid or body');
    Notifications.showNotification("outboundMessageFailed", {
      message: "Template ou mensagem de texto deve ser fornecido",
    });
    return { success: false, error: 'Missing message content' };
  }

  const requestBody = {
    Token: manager.store.getState().flex.session.ssoTokenPayload.token,
    to,
    from: from || process.env.FLEX_APP_TWILIO_FROM_NUMBER,
    queueSid,
    workerSid: manager.workerClient?.sid,
    workerFriendlyName: manager.user?.identity,
    workspaceSid: process.env.FLEX_APP_WORKSPACE_SID,
    workflowSid: process.env.FLEX_APP_WORKFLOW_SID,
    openChatFlag: openChatFlag.toString(),
    priority: priority.toString(),
    timeout: timeout.toString(),
  };

  // Add message content
  if (contentTemplateSid) {
    requestBody.contentTemplateSid = contentTemplateSid;
  } else {
    requestBody.body = body;
  }

  const options = {
    method: "POST",
    body: new URLSearchParams(requestBody),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  };

  try {
    const domain = resolveServerlessDomain();
    const url = `${domain}/features/outbound-messaging/send-whatsapp-message`;
    
    const token = requestBody.Token || '';
    const tokenPreview = token ? `${token.substring(0, 6)}...${token.substring(token.length - 4)}` : 'n/a';
    
    console.debug('[sendWhatsappToQueue] Request info', {
      url,
      to,
      queueSid,
      openChatFlag,
      hasTemplate: !!contentTemplateSid,
      hasBody: !!body,
      tokenPreview,
    });

    const resp = await fetch(url, options);
    const data = await resp.json();

    console.debug('[sendWhatsappToQueue] Response', {
      success: data.success,
      conversationSid: data.conversationSid,
      taskSid: data.taskSid,
      queueSid: data.queueSid,
      isNewConversation: data.isNewConversation,
    });

    if (data.success) {
      if (openChatFlag) {
        Notifications.showNotification("outboundMessageSent", {
          message: `Mensagem enviada para ${to} e roteada para a fila`,
        });
      } else {
        Notifications.showNotification("outboundMessageSent", {
          message: `Mensagem enviada para ${to}. Aguardando resposta do cliente.`,
        });
      }
      return { success: true, data };
    } else {
      console.error('[sendWhatsappToQueue] Server returned error', data);
      Notifications.showNotification("outboundMessageFailed", {
        message: data.errorMessage || "Erro ao enviar mensagem",
      });
      return { success: false, error: data.errorMessage, data };
    }
  } catch (error) {
    console.error('[sendWhatsappToQueue] Request failed', error);
    Notifications.showNotification("outboundMessageFailed", {
      message: "Erro ao chamar função serverless",
    });
    return { success: false, error: error.message };
  }
};

/**
 * Register Flex action for sending WhatsApp messages to specific queues
 * 
 * Payload:
 * - destination: Phone number (required)
 * - queueSid: Queue SID (required)
 * - contentTemplateSid: WhatsApp template SID (optional, use this or body)
 * - body: Message text (optional, use this or contentTemplateSid)
 * - callerId: WhatsApp number (optional, defaults to env var)
 * - openChat: Create task immediately (optional, default: true)
 * - priority: Task priority (optional, default: 0)
 * - timeout: Task timeout in seconds (optional, default: 86400)
 */
Actions.registerAction("SendWhatsappToQueue", async (payload) => {
  console.log('[SendWhatsappToQueue] Action invoked', {
    destination: payload.destination,
    queueSid: payload.queueSid,
    hasTemplate: !!payload.contentTemplateSid,
    hasBody: !!payload.body,
    openChat: payload.openChat,
  });

  const result = await sendWhatsappToQueue({
    to: payload.destination,
    from: payload.callerId,
    queueSid: payload.queueSid,
    contentTemplateSid: payload.contentTemplateSid,
    body: payload.body,
    openChatFlag: payload.openChat !== false, // default true
    priority: payload.priority || 0,
    timeout: payload.timeout || 86400,
  });

  return result;
});

export default sendWhatsappToQueue;
