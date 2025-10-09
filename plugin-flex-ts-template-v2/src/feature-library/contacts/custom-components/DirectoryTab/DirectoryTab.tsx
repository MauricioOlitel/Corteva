import React, { useEffect, useState, useMemo } from 'react';
import { templates, Template, Manager } from '@twilio/flex-ui';
import { useSelector } from 'react-redux';
import { Button } from '@twilio-paste/core/button';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalFooterActions } from '@twilio-paste/core/modal';
import { Table, THead, TBody, Tr, Th, Td } from '@twilio-paste/core/table';
import { Flex } from '@twilio-paste/core/flex';
import { Heading } from '@twilio-paste/core/heading';
import { Box } from '@twilio-paste/core/box';
import { Input } from '@twilio-paste/core/input';
import { DataGrid, DataGridHead, DataGridHeader, DataGridRow, DataGridBody } from '@twilio-paste/core/data-grid';
import { AlertDialog } from '@twilio-paste/core/alert-dialog';
import { PlusIcon } from '@twilio-paste/icons/esm/PlusIcon';
import { SearchIcon } from '@twilio-paste/icons/esm/SearchIcon';
import debounce from 'lodash/debounce';

import ContactsUtil from '../../utils/ContactsUtil';
import ContactEditModal from './ContactEditModal';
import ContactRecord from './ContactRecord';
import Paginator from '../Paginator';
import { Contact, RawContato } from '../../types/types';
import AppState from '../../../../types/manager/AppState';
import { reduxNamespace } from '../../../../utils/state';
import { StringTemplates } from '../../flex-hooks/strings/strings';
import  WhatsappButton from '../../../outbound/components/WhatsappButton';
import { SendWhatsappModal } from './SendWhatsappModal';
import SendWhatsappSidePanel from '../../../outbound/components/SendWhatsappSidePanel';
import { fetchContentTemplates } from "../../../outbound/utils/fetchContentTemplates";
import { ContactDetailModal } from './ContactDetailModal';
import { v4 as uuidv4 } from 'uuid';
import { Select, Option } from '@twilio-paste/core/select';
import * as XLSX from 'xlsx';

export interface OwnProps {
  shared: boolean;
  allowEdits: boolean;
  pageSize: number;
}


const DirectoryTab = ({ shared, allowEdits, pageSize: initialPageSize }: OwnProps) => {
  // Use central ContactsUtil logic (supports localStorage forceNonSupervisor) instead of duplicating role check
  const canEdit = useMemo(() => allowEdits && ContactsUtil.isSupervisor(), [allowEdits]);
  const [whatsappTemplates, setWhatsappTemplates] = useState([]);
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [panelContact, setPanelContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [whatsappModalContact, setWhatsappModalContact] = useState<Contact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pageSize, setPageSize] = useState(initialPageSize || 10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null as Contact | null);
  const [contactToDelete, setContactToDelete] = useState(null as Contact | null);
  const [searchValue, setSearchValue] = useState('');
  const [currentPageContacts, setCurrentPageContacts] = useState([] as Contact[]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pendingImport, setPendingImport] = useState<any[] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const contactList = useSelector((state: AppState) =>
    shared ? state[reduxNamespace]?.contacts?.sharedDirectory : state[reduxNamespace]?.contacts?.directory,
  );

  useEffect(() => {
    if (!Boolean(searchValue)) {
      // Skip filtering if no search was specified
      setupPage(contactList);
      return;
    }
    // Search by all properties except these
    const keysToIgnore = ['key'];
    const searchValueLower = searchValue.toLowerCase();
    setupPage(
      contactList.filter((contact: Contact) => {
        for (const key of Object.keys(contact)) {
          if (keysToIgnore.includes(key)) continue;
          if (
            String((contact as any)[key])
              .toLowerCase()
              .includes(searchValueLower)
          )
            return true;
        }
        return false;
      }),
    );
  }, [contactList, currentPage, searchValue, pageSize]);

  useEffect(() => {
    fetchContentTemplates().then((templates) => { console.log('Templates', templates); setWhatsappTemplates(templates || []); });
  }, []); // só uma vez na montagem

  const setupPage = (contacts: Contact[]) => {
    const newTotalPages = Math.ceil(contacts.length / pageSize);
    const newStartIndex = (currentPage - 1) * pageSize;
    setTotalPages(newTotalPages);
    if (contacts.length && contacts.length <= newStartIndex) {
      setCurrentPage(newTotalPages);
      return;
    }
    setCurrentPageContacts(contacts.slice(newStartIndex, Math.min(currentPage * pageSize, contacts.length)));
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setContactToEdit(null);
  };

  const addContact = () => {
    setContactToEdit(null);
    setEditModalOpen(true);
  };

  const deleteContact = (contact: Contact) => {
    setContactToDelete(contact);
  };

  const editContact = (contact: Contact) => {
    setContactToEdit(contact);
    setEditModalOpen(true);
  };

  const openDetailModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };
  const closeDetailModal = () => {
    setSelectedContact(null);
    setShowDetailModal(false);
  };

  const performDelete = async () => {
    if (!contactToDelete) {
      return;
    }
    await ContactsUtil.deleteContact(contactToDelete.key, shared);
    setContactToDelete(null);
  };

  const filterDirectory = (value: string) => {
    setSearchValue(value);
  };

  const filterDirectoryDebounce = debounce(filterDirectory, 500, { maxWait: 1000 });

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterDirectoryDebounce(e.target.value);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const confirmImport = () => {
    if (!canEdit) return; // safety
    if (!pendingImport) return;
    const contatosParaImportar = pendingImport;
    // Fecha o modal antes de iniciar o processamento para liberar a UI
    setPendingImport(null);
    setIsPreviewOpen(false);

    // Aviso inicial ao usuário sobre processamento assíncrono
    alert('Importação iniciada em segundo plano. Você pode continuar navegando normalmente. Avisaremos quando for concluída.');

    // Processa em background (sem bloquear a confirmação)
    (async () => {
      let importados = 0;
      let erros = 0;
      for (const contato of contatosParaImportar) {
        try {
          await ContactsUtil.addContactFull(contato, true);
          importados++;
        } catch (e) {
          erros++;
          console.error('Erro ao importar contato', contato, e);
        }
      }
      if (erros === 0) {
        alert(`${importados} contatos importados com sucesso!`);
      } else {
        alert(`Importação concluída: ${importados} contatos importados com sucesso. ${erros} falhas. Consulte o console para detalhes.`);
      }
    })();
  };

  const cancelImport = () => {
    setPendingImport(null);
    setIsPreviewOpen(false);
  };

  const handleExcelImport = async (event: React.ChangeEvent<HTMLInputElement>, shared: boolean = true) => {
    if (!canEdit) return; // safety
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const contatosRaw = XLSX.utils.sheet_to_json<RawContato>(worksheet, { defval: "" });
        const mapped = contatosRaw.map(raw => ({
          areaDeVendas: raw.Area_de_Vendas,
          segmento: raw.Segmento,
          acesso: raw.Acesso,
          distrito: raw.Distrito,
          codDistrito: raw.Cod_Distrito,
          funcao: raw.Funcao,
          codRC: raw.Cod_RC,
          name: raw.Nome,
          email: raw.Email,
          lider: raw.Lider,
          rsl: raw.RSL,
          myAccessID: raw.MyAccess_ID,
          myAccessIDSeed: raw.MyAccess_ID_Seed,
          phoneNumber: raw.Celular,
          cnpj: raw.CNPJ,
          filaAtendimentoSemKAMSeeds: raw.Fila_atendimento_sem_KAM_SEEDS,
          filaSeedsTwilio: raw.FILA_SEEDS_TWILIO,
          filaAtendimentoSemKAMCrop: raw.Fila_atendimento_sem_KAM_CROP,
          filaCropTwilio: raw.FILA_CROP_TWILIO,
          agenteKAMSeeds: raw.Agente_KAM_Seeds,
          sidSeedsTwilio: raw.SID_Seeds_TWILIO,
          agenteKAMCrop: raw.Agente_KAM_Crop,
          sidCropTwilio: raw.SID_Crop_TWILIO,
          responsavelPelaAtualizacao: raw.Responsavel_pela_atualização,
          key: raw.Email || raw.Celular || uuidv4(),
        }));
        setPendingImport(mapped);
        setIsPreviewOpen(true);
        // DICA: se quiser, pode forçar reload dos contatos aqui!
      } catch (err: any) {
        alert("Erro ao importar contatos: " + err.message);
        console.error(err);
      }
    };

    reader.readAsArrayBuffer(file);
  };


  return (
  <>
    {/* Input de arquivo, sempre presente, mas escondido */}
    <input
      id="excel-upload-input"
      type="file"
      accept=".xlsx,.xls"
      style={{ display: 'none' }}
      onChange={(e) => handleExcelImport(e, true)}
    />

    {isPreviewOpen && pendingImport && (
      <Modal isOpen={isPreviewOpen} onDismiss={cancelImport} size="wide" ariaLabelledby="preview-import">
        <ModalHeader>Pré-visualização da Importação ({pendingImport.length} registros)</ModalHeader>
        <ModalBody>
          <Table scrollHorizontally>
            <THead>
              <Tr>
                <Th>Nome</Th>
                <Th>Email</Th>
                <Th>Celular</Th>
                <Th>Segmento</Th>
                <Th>Área de Vendas</Th>
              </Tr>
            </THead>
            <TBody>
              {pendingImport.slice(0, 10).map(c => (
                <Tr key={c.key}>
                  <Td>{c.name}</Td>
                  <Td>{c.email}</Td>
                  <Td>{c.phoneNumber}</Td>
                  <Td>{c.segmento}</Td>
                  <Td>{c.areaDeVendas}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          {pendingImport.length > 10 && <Box marginTop="space40">Mostrando 10 de {pendingImport.length} registros...</Box>}
        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button variant="secondary" onClick={cancelImport}>Cancelar</Button>
            <Button variant="primary" onClick={confirmImport}>Confirmar Importação</Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    )}

    {!contactList || contactList.length === 0 ? (
      <Flex vertical width="100%" hAlignContent="center" padding="space50">
        <Heading as="h5" variant="heading50">
          <Template source={templates[StringTemplates.NoContacts]} />
        </Heading>
  {canEdit && (
          <Flex>
            <Button
              variant="primary"
              onClick={addContact}
            >
              <PlusIcon decorative />
              <Template source={templates[StringTemplates.ContactAdd]} />
            </Button>
            <Box width="20px" />
            <Button
              variant="secondary"
              onClick={() => document.getElementById('excel-upload-input')?.click()}
            >
              Importar Planilha Excel
            </Button>
          </Flex>
        )}
      </Flex>
    ) : (
      <Flex vertical hAlignContent="right">
        <Box width="100%">
          <Flex hAlignContent="between" marginBottom="space50" grow shrink>
            <Box maxWidth="300px">
              <Input
                insertBefore={<SearchIcon decorative={true} />}
                type="text"
                key={`directory-search-field-${shared}`}
                onChange={onSearch}
                placeholder={templates[StringTemplates.ContactSearch]()}
              />
            </Box>
            {/* Select de quantidade por página */}
            <Box minWidth="130px" marginLeft="space40" marginRight="space40">
              <Select
                value={String(pageSize)}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                <Option value="10">10 / página</Option>
                <Option value="25">25 / página</Option>
                <Option value="50">50 / página</Option>
                <Option value="100">100 / página</Option>
              </Select>

            </Box>
            {canEdit && (
              <Flex>
                <Button
                  variant="primary"
                  onClick={addContact}
                >
                  <PlusIcon decorative />
                  <Template source={templates[StringTemplates.ContactAdd]} />
                </Button>
                <Box width="20px" />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('excel-upload-input')?.click()}
                >
                  Importar Planilha Excel
                </Button>
              </Flex>
            )}
          </Flex>
        </Box>
        <Box width="100%">
          <DataGrid
            variant="default"
            striped
            aria-label={
              shared ? templates[StringTemplates.SharedContacts]() : templates[StringTemplates.MyContacts]()
            }
            element="CONTACTS_TABLE"
          >
            <DataGridHead>
              <DataGridRow>
                <DataGridHeader element="CONTACTS_TABLE_CELL">
                  <Template source={templates[StringTemplates.ContactName]} />
                </DataGridHeader>
                <DataGridHeader element="CONTACTS_TABLE_CELL">
                  <Template source={templates[StringTemplates.ContactPhoneNumber]} />
                </DataGridHeader>
                <DataGridHeader element="CONTACTS_TABLE_CELL" textAlign="right">
                  <Template source={templates[StringTemplates.ContactActions]} />
                </DataGridHeader>
              </DataGridRow>
            </DataGridHead>
            <DataGridBody>
              {currentPageContacts?.map((contact: Contact) => (
                <ContactRecord
                  key={contact.key}
                  contact={contact}
                  allowEdits={canEdit}
                  editContact={editContact}
                  deleteContact={deleteContact}
                  onNameClick={openDetailModal}
                  renderWhatsappButton={() => (
                    <WhatsappButton
                      phoneNumber={contact.phoneNumber ?? ""}
                      onClick={() => { setPanelContact(contact); setShowWhatsappPanel(true);} }
                    />
                  )}
                />
              ))}
            </DataGridBody>
          </DataGrid>
          <Flex hAlignContent="center" marginTop="space50">
            <Paginator currentPage={currentPage} totalPages={totalPages} goToPage={goToPage} />
          </Flex>
        </Box>
      </Flex>
    )}
    <AlertDialog
      heading={templates[StringTemplates.ContactDelete]()}
      isOpen={Boolean(contactToDelete)}
      onConfirm={performDelete}
      onConfirmLabel={templates.ConfirmableDialogConfirmButton()}
      onDismiss={() => setContactToDelete(null)}
      onDismissLabel={templates.ConfirmableDialogCancelButton()}
    >
      <Template source={templates[StringTemplates.ContactDeleteConfirm]} name={contactToDelete?.name} />
    </AlertDialog>
    <ContactDetailModal contact={selectedContact} isOpen={showDetailModal} onClose={closeDetailModal} />
    <ContactEditModal contact={contactToEdit} isOpen={editModalOpen} shared={shared} handleClose={closeEditModal} />
    <SendWhatsappModal isOpen={!!whatsappModalContact} phoneNumber={whatsappModalContact?.phoneNumber ?? ""} message="" onClose={() => setWhatsappModalContact(null)} />
    <SendWhatsappSidePanel isOpen={showWhatsappPanel} templates={whatsappTemplates} phoneNumber={panelContact?.phoneNumber ?? ""} onClose={() => setShowWhatsappPanel(false)} />
  </>
);
  



};

export default DirectoryTab;
