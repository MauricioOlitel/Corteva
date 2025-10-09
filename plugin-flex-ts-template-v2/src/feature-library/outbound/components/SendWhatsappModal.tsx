// feature-library/outbound/SendWhatsappModal.tsx

import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@twilio-paste/core/modal";
import { Button } from "@twilio-paste/core/button";
import { Box, TextArea, Label, HelpText } from "@twilio-paste/core";
import { Contact } from "../../contacts/types/types";
// Você pode ajustar o path do Contact conforme a estrutura do seu projeto

interface SendWhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSend?: (payload: { phoneNumber: string|undefined; message: string }) => Promise<void> | void;
}

export const SendWhatsappModal: React.FC<SendWhatsappModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSend,
}) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!contact) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      if (onSend) {
        await onSend({ phoneNumber: contact.phoneNumber, message });
      }
      setMessage("");
      onClose();
    } catch (error) {
      alert("Erro ao enviar mensagem: " + (error as Error).message);
    }
    setIsSending(false);
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onClose} size="wide" ariaLabelledby="Envio de WhatsApp">
      <ModalHeader>Enviar WhatsApp</ModalHeader>
      <ModalBody>
        <Box marginBottom="space60">
          <Label htmlFor="whatsapp-phone">Número do WhatsApp</Label>
          <Box padding="space30" backgroundColor="colorBackgroundWeak" borderRadius="borderRadius20">
            {contact.phoneNumber}
          </Box>
        </Box>
        <Box>
          <Label htmlFor="whatsapp-message">Mensagem</Label>
          <TextArea
            id="whatsapp-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Digite a mensagem a ser enviada"
            rows={4}
            disabled={isSending}
          />
          <HelpText>Esta mensagem será enviada para o WhatsApp do contato.</HelpText>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          loading={isSending}
        >
          Enviar WhatsApp
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SendWhatsappModal;
