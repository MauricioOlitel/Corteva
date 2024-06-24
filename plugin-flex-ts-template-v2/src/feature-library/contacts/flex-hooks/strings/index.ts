// Export the template names as an enum for better maintainability when accessing them elsewhere
import esES from './es-es.json';
import esMX from './es-mx.json';

export enum StringTemplates {
  Contacts = 'PSContacts',
  MyContacts = 'PSMyContacts',
  SharedContacts = 'PSSharedContacts',
  Recent = 'PSContactsRecent',
  NoContacts = 'PSNoContacts',
  NoHistory = 'PSNoHistory',
  ClearHistory = 'PSClearHistory',
  ClearHistoryDialog = 'PSClearHistoryDialog',
  ContactChannel = 'PSContactChannel',
  ContactInboundCall = 'PSContactInboundCall',
  ContactOutboundCall = 'PSContactOutboundCall',
  ContactInboundAddress = 'PSContactInboundAddress',
  ContactCustomerAddress = 'PSContactCustomerAddress',
  ContactPhoneNumber = 'PSContactPhoneNumber',
  ClickToCall = 'PSClickToCall',
  ContactActions = 'PSContactActions',
  PlaceOutboundCall = 'PSPlaceOutboundCall',
  OutboundCallDialog = 'PSOutboundCallDialog',
  OutboundNumberToDial = 'PSOutboundNumberToDial',
  OutboundCallerId = 'PSOutboundCallerId',
  PlaceCall = 'PSPlaceCall',
  ContactName = 'PSContactName',
  ContactDefaultCustomer = 'PSContactDefaultCustomer',
  ContactDateTime = 'PSContactDateTime',
  ContactDuration = 'PSContactDuration',
  ContactQueue = 'PSContactQueue',
  ContactOutcome = 'PSContactOutcome',
  ContactNotes = 'PSContactNotes',
  ContactAdd = 'PSContactAdd',
  ContactDelete = 'PSContactDelete',
  ContactDeleteConfirm = 'PSContactDeleteConfirm',
  ContactEdit = 'PSContactEdit',
  OutboundContactHeader = 'PSOutboundContactHeader',
  OutboundContactLabel = 'PSOutboundContactLabel',
  ContactSearch = 'PSContactSearch',
  NoItems = 'PSContactNoItems',
  CurrentPage = 'PSContactCurrentPage',
  NextPage = 'PSContactNextPage',
  PreviousPage = 'PSContactPreviousPage',
}

export const stringHook = () => ({
  'en-US': {
    [StringTemplates.Contacts]: 'Contacts',
    [StringTemplates.MyContacts]: 'My Contacts',
    [StringTemplates.SharedContacts]: 'Shared Contacts',
    [StringTemplates.Recent]: 'Recent',
    [StringTemplates.NoContacts]: 'No contacts have been created yet.',
    [StringTemplates.NoHistory]: 'Calls and chats will appear here once they are completed.',
    [StringTemplates.ClearHistory]: 'Clear History',
    [StringTemplates.ClearHistoryDialog]: 'Please confirm that you want to delete all your contact history.',
    [StringTemplates.ContactChannel]: 'Channel',
    [StringTemplates.ContactInboundCall]: 'Inbound Call',
    [StringTemplates.ContactOutboundCall]: 'Outbound Call',
    [StringTemplates.ContactInboundAddress]: 'Inbound Address',
    [StringTemplates.ContactCustomerAddress]: 'Customer Address',
    [StringTemplates.ContactPhoneNumber]: 'Phone Number',
    [StringTemplates.ClickToCall]: 'Click to make a call',
    [StringTemplates.ContactActions]: 'Actions',
    [StringTemplates.PlaceOutboundCall]: 'Place Outbound Call',
    [StringTemplates.OutboundCallDialog]: 'Please confirm you want to call',
    [StringTemplates.OutboundNumberToDial]: 'Number to dial',
    [StringTemplates.OutboundCallerId]: 'Caller ID',
    [StringTemplates.PlaceCall]: 'Place Call',
    [StringTemplates.ContactName]: 'Name',
    [StringTemplates.ContactDefaultCustomer]: 'Customer',
    [StringTemplates.ContactDateTime]: 'Date & Time',
    [StringTemplates.ContactDuration]: 'Task Duration',
    [StringTemplates.ContactQueue]: 'Queue',
    [StringTemplates.ContactOutcome]: 'Outcome',
    [StringTemplates.ContactNotes]: 'Notes',
    [StringTemplates.ContactAdd]: 'Add contact',
    [StringTemplates.ContactDelete]: 'Delete contact',
    [StringTemplates.ContactDeleteConfirm]: 'Are you sure you wish to delete the contact "{{name}}"?',
    [StringTemplates.ContactEdit]: 'Edit contact',
    [StringTemplates.OutboundContactHeader]: 'Call Contact',
    [StringTemplates.OutboundContactLabel]: 'Select a contact',
    [StringTemplates.ContactSearch]: 'Search contacts',
    [StringTemplates.NoItems]: 'No items found',
    [StringTemplates.CurrentPage]: 'Page {{current}} of {{total}}',
    [StringTemplates.NextPage]: 'Next page',
    [StringTemplates.PreviousPage]: 'Previous page',
  },
  'es-MX': esMX,
  'es-ES': esES,
});
