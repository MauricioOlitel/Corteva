import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@twilio-paste/core/modal";
import { Button } from "@twilio-paste/core/button";
import { Input } from "@twilio-paste/core/input";
import { TextArea } from "@twilio-paste/core/textarea";
import { Box, Text } from "@twilio-paste/core";
import { Label } from "@twilio-paste/core/label";

interface SendWhatsappModalProps {
  isOpen: boolean;
  phoneNumber: string;
  message?: string;
  onClose: () => void;
  onSend?: (to: string, message: string) => void;
}

export const SendWhatsappModal: React.FC<SendWhatsappModalProps> = ({
  isOpen,
  phoneNumber,
  message = "",
  onClose,
  onSend,
}) => {
  const [to, setTo] = useState(phoneNumber);
  const [msg, setMsg] = useState(message);
  const [sending, setSending] = useState(false);

  // Limpa ao abrir/fechar
  React.useEffect(() => {
    if (isOpen) {
      setTo(phoneNumber);
      setMsg(message || "");
    }
  }, [isOpen, phoneNumber, message]);

  const handleSend = async () => {
    setSending(true);
    if (onSend) {
      await onSend(to, msg);
    } else {
      // Aqui, você pode disparar sua Action do Flex, chamada de API, etc.
      alert(`Mensagem enviada para WhatsApp: ${to}\n${msg}`);
    }
    setSending(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onDismiss={onClose} size="default" ariaLabelledby="Enviar WhatsApp">
      <ModalHeader>Enviar WhatsApp</ModalHeader>
      <ModalBody>
        <Box>
          <Label htmlFor="whatsapp-to">Celular (WhatsApp)</Label>
          <Input
            id="whatsapp-to"
            value={to}
            onChange={e => setTo(e.target.value)}
            type="text"
            placeholder="Ex: 5511999999999"
            disabled={sending}
          />
          <Label htmlFor="whatsapp-msg">Mensagem</Label>
          <TextArea
            id="whatsapp-msg"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            placeholder="Digite a mensagem para o WhatsApp"
            disabled={sending}
            rows={4}
          />
          <Text as="div" color="colorTextWeak" fontSize="fontSize20" marginTop="space30">
            O número deve estar em formato internacional (ex: 5511999999999)
          </Text>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!to || !msg || sending}
          loading={sending}
        >
          Enviar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default SendWhatsappModal;
