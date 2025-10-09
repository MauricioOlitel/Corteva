import React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@twilio-paste/core/modal";
import { Button } from "@twilio-paste/core/button";
import { Contact } from "../../types/types";
import { Box, Text } from "@twilio-paste/core";
import { Flex } from "@twilio-paste/core/flex";
import { Label } from '@twilio-paste/core/label';
import { Heading } from '@twilio-paste/core/heading';

interface ContactDetailModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

const contatoLabels: { [key: string]: string } = {
  name: "Nome",
  email: "Email",
  areaDeVendas: "Area_de_Vendas",
  segmento: "Segmento",
  acesso: "Acesso",
  distrito: "Distrito",
  codDistrito: "Cod_Distrito",
  funcao: "Funcao",
  codRC: "Cod_RC",
  lider: "Lider",
  rsl: "RSL",
  myAccessID: "MyAccess_ID",
  myAccessIDSeed: "MyAccess_ID_Seed",
  phoneNumber: "Celular",
  cnpj: "CNPJ",
  filaAtendimentoSemKAMSeeds: "Fila_atendimento_sem_KAM_SEEDS",
  filaSeedsTwilio: "FILA_SEEDS_TWILIO",
  filaAtendimentoSemKAMCrop: "Fila_atendimento_sem_KAM _CROP",
  filaCropTwilio: "FILA_CROP_TWILIO",
  agenteKAMSeeds: "Agente_KAM_Seeds",
  sidSeedsTwilio: "SID_Seeds_TWILIO",
  agenteKAMCrop: "Agente_KAM_Crop",
  sidCropTwilio: "SID_Crop_TWILIO",
  responsavelPelaAtualizacao: "Responsavel_pela _atualização",
};


export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({ contact, isOpen, onClose }) => {
  if (!contact) return null;

  return (
    <Modal isOpen={isOpen} onDismiss={onClose} size="wide" ariaLabelledby="Detalhes do Contato">
      <ModalHeader>
        {contact.name}
      </ModalHeader>
      <ModalBody>
        <Box>
          <Heading as="h4" variant="heading40">
            {contact?.name}
          </Heading>
          <Flex wrap width="100%">
            {/* Coluna 1 */}
            <Box flex="1">
              <Box as="dl">
                {Object.entries(contatoLabels).map(([key, label], idx) =>
                  idx % 2 === 0 && contact[key as keyof typeof contact] ? (
                    <Box key={key} marginBottom="space40">
                      <Box as="dt" fontWeight="fontWeightBold">{label}</Box>
                      <Box as="dd" marginLeft="space40">{contact[key as keyof typeof contact]}</Box>
                    </Box>
                  ) : null
                )}
              </Box>
            </Box>
            {/* Coluna 2 */}
            <Box flex="1">
              <Box as="dl">
                {Object.entries(contatoLabels).map(([key, label], idx) =>
                  idx % 2 === 1 && contact[key as keyof typeof contact] ? (
                    <Box key={key} marginBottom="space40">
                      <Box as="dt" fontWeight="fontWeightBold">{label}</Box>
                      <Box as="dd" marginLeft="space40">{contact[key as keyof typeof contact]}</Box>
                    </Box>
                  ) : null
                )}
              </Box>
            </Box>
          </Flex>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>Fechar</Button>
      </ModalFooter>
    </Modal>
  );
};


