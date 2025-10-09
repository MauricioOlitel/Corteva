import { Icon, Template, templates } from '@twilio/flex-ui';
import { Flex } from '@twilio-paste/core/flex';
import { Box } from '@twilio-paste/core/box';
import { Tooltip } from '@twilio-paste/core/tooltip';
import { DataGridRow, DataGridCell } from '@twilio-paste/core/data-grid';
import { ProductChatIcon } from '@twilio-paste/icons/esm/ProductChatIcon';
import { CallIncomingIcon } from '@twilio-paste/icons/esm/CallIncomingIcon';
import { CallOutgoingIcon } from '@twilio-paste/icons/esm/CallOutgoingIcon';
import { SMSIcon } from '@twilio-paste/icons/esm/SMSIcon';
import { ChatIcon } from '@twilio-paste/icons/esm/ChatIcon';

import { StringTemplates } from '../../flex-hooks/strings/strings';
import { HistoricalContact } from '../../types/types';
import NotesPopover from '../NotesPopover';
import OutboundCallModal from '../OutboundCallModal';

export interface OwnProps {
  contact: HistoricalContact;
}

const HistoricalContactRecord = ({ contact }: OwnProps) => {

  const {
    taskSid,
    channelType,
    direction,
    customerAddress,
    inboundAddress,
    name,
    dateTime,
    duration,
    queueName,
    outcome,
    notes,
  } = contact;

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration / 60) % 60;
  const ss = (duration % 60).toString().padStart(2, '0');
  let mm = minutes.toString();
  if (hours > 0) mm = minutes.toString().padStart(2, '0');
  let taskDuration = hours > 0 ? `${hours}:` : '';
  taskDuration += `${mm}:${ss}`;

  return (
    <DataGridRow key={taskSid}>
      <DataGridCell element="CONTACTS_TABLE_CELL" textAlign="center">
        <Flex hAlignContent="center">
          <Box padding="space20">
            {channelType === 'voice' && direction === 'inbound' && (
              <Tooltip text={templates[StringTemplates.ContactInboundCall]()} placement="top">
                <div>
                  <CallIncomingIcon decorative={true} />
                </div>
              </Tooltip>
            )}
            {channelType === 'voice' && direction === 'outbound' && (
              <Tooltip text={templates[StringTemplates.ContactOutboundCall]()} placement="top">
                <div>
                  <CallOutgoingIcon decorative={true} />
                </div>
              </Tooltip>
            )}
            {channelType === 'sms' && <SMSIcon decorative={true} />}
            {channelType === 'web' && <ChatIcon decorative={true} />}
            {channelType === 'whatsapp' && <Icon icon="Whatsapp" sizeMultiplier={20 / 24} />}
            {channelType === 'custom' && <ProductChatIcon decorative={true} />}
          </Box>
        </Flex>
      </DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{inboundAddress}</DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">
        {/* Show real customer name when available, otherwise fallback to inboundAddress or default label */}
        {name ? (
          <span>{name}</span>
        ) : customerAddress ? (
          <span>{customerAddress}</span>
        ) : (
          <Template source={templates[StringTemplates.ContactDefaultCustomer]} />
        )}
      </DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{dateTime}</DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{taskDuration}</DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{queueName}</DataGridCell>
      <DataGridCell element="CONTACTS_TABLE_CELL">{outcome}</DataGridCell>
  {/* Actions column removed per requirements */}
    </DataGridRow>
  );
};

export default HistoricalContactRecord;
