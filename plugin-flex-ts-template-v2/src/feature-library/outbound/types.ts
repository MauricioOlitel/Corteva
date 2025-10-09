export type OutboundMessageType = "sms" | "whatsapp";

export interface OutboundMessagePayload {
  destination: string;         // Exemplo: "+5511988887777" ou "whatsapp:+5511988887777"
  callerId: string;            // Exemplo: "+5511999998888" ou "whatsapp:+5511999998888"
  body: string;                // Mensagem de texto ou corpo do template
  contentTemplateSid?: string; // Opcional: sid do template de conteúdo (para WhatsApp)
  messageType: OutboundMessageType;
  openChat?: boolean;          // Se irá abrir um chat imediatamente
  routeToMe?: boolean;         // Se irá rotear o retorno para o agente atual
}

export interface ContentTemplate {
  sid: string;
  name: string;
}

export interface WhatsappSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactPhone: string;
  contactName?: string;
}