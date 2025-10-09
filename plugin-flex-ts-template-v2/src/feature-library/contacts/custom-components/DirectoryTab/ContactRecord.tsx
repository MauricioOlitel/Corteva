import { templates } from '@twilio/flex-ui';
import { Flex } from '@twilio-paste/core/flex';
import { Button } from '@twilio-paste/core/button';
import { DeleteIcon } from '@twilio-paste/icons/esm/DeleteIcon';
import { EditIcon } from '@twilio-paste/icons/esm/EditIcon';
import { DataGridRow, DataGridCell } from '@twilio-paste/core/data-grid';

import { StringTemplates } from '../../flex-hooks/strings/strings';
import { Contact } from '../../types/types';
import NotesPopover from '../NotesPopover';
import OutboundCallModal from '../OutboundCallModal';

export interface ContactRecordProps {
  contact: Contact;
  allowEdits: boolean;
  deleteContact: (contact: Contact) => void;
  editContact: (contact: Contact) => void;
  onNameClick?: (contact: Contact) => void; 
  renderWhatsappButton?: () => React.ReactNode;
}

const ContactRecord: React.FC<ContactRecordProps> = ({
  contact,
  allowEdits,
  editContact,
  deleteContact,
  onNameClick,
  renderWhatsappButton,
}) => (
    <DataGridRow key={contact.key}>
      <DataGridCell>
        <Button
          variant="link"
          onClick={() => onNameClick?.(contact)}
          style={{ padding: 0, fontWeight: 600 }}
        >
          {contact.name}
        </Button>
      </DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{contact.phoneNumber}</DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL" textAlign="right">
        <Flex vAlignContent="center" hAlignContent="right">
          {/* Botão de WhatsApp */}
          {renderWhatsappButton && renderWhatsappButton()}

          {/* Notas, ligação, etc */}
          {contact.notes && <NotesPopover notes={contact.notes} />}
          <OutboundCallModal phoneNumber={contact.phoneNumber || ''} />

          {/* Botões de editar/deletar */}
          {allowEdits && (
            <Flex marginLeft="space50">
              <Button
                variant="primary_icon"
                size="icon_small"
                title={templates[StringTemplates.ContactEdit]()}
                onClick={() => {
                  editContact(contact);
                }}
              >
                <EditIcon decorative={true} />
              </Button>
              <Button
                variant="destructive_icon"
                size="icon_small"
                title={templates[StringTemplates.ContactDelete]()}
                onClick={() => {
                  deleteContact(contact);
                }}
              >
                <DeleteIcon decorative={true} />
              </Button>
            </Flex>
          )}
        </Flex>
      </DataGridCell>
    </DataGridRow>
  );

export default ContactRecord;
