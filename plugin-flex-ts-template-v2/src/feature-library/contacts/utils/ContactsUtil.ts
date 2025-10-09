import * as Flex from '@twilio/flex-ui';
import { Manager } from '@twilio/flex-ui';
import { v4 as uuidv4 } from 'uuid';

import {
  addHistoricalContact,
  initRecents,
  clearRecents,
  addDirectoryContact,
  updateDirectoryContact,
  removeDirectoryContact,
  initDirectory,
} from '../flex-hooks/state/state';
import { Contact, HistoricalContact } from '../types/types';
import {
  getRecentDaysToKeep,
  isRecentsEnabled,
  isPersonalDirectoryEnabled,
  isSharedDirectoryEnabled,
  isSharedDirectoryAgentEditable,
} from '../config';
import { getUserLanguage, getLoadedFeatures, getFeatureFlags } from '../../../utils/configuration';
import SyncClient, { getAllSyncMapItems } from '../../../utils/sdk-clients/sync/SyncClient';
import logger from '../../../utils/logger';
import { Message } from '@twilio/conversations';

const CONTACTS_RECENT_KEY = 'Contacts_Recent';
const CONTACTS_KEY = 'Contacts';

class ContactsUtil {
  isRecentsInitialized = false;

  manager = Manager.getInstance();

  accountSid = this.manager.serviceConfiguration.account_sid;

  workerSid = this.manager.workerClient?.workerSid;

  // Basic role check (Flex roles array contains roles like 'agent', 'supervisor', 'admin')
  isSupervisor = () => {
    try {
      // Local override for testing: set localStorage.forceNonSupervisor = 'true' to force false
      const forced = typeof window !== 'undefined' && window.localStorage?.getItem('forceNonSupervisor') === 'true';
      const roles = this.manager.user.roles || [];
      if (forced) {
        // eslint-disable-next-line no-console
        console.log('[contacts] forceNonSupervisor override ativo');
        return false;
      }
      return roles.includes('supervisor') || roles.includes('admin');
    } catch {
      return false;
    }
  };

  canEditShared = () => {
    const { roles } = this.manager.user;
    return isSharedDirectoryAgentEditable() === true || roles.indexOf('admin') >= 0 || roles.indexOf('supervisor') >= 0;
  };

  initRecents = async () => {
    if (this.isRecentsInitialized) {
      return;
    }
    if (!this.workerSid) {
      logger.error('[contacts] Error loading recent contacts: No worker sid');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_RECENT_KEY}_${this.workerSid}`);
      const mapItems = await getAllSyncMapItems(map);

      // Subscribe to events which trigger Redux updates
      map.on('itemAdded', (args) => {
        // DEBUG: log incoming sync map item to browser console and dispatch to redux
        try {
          // eslint-disable-next-line no-console
          console.log('[contacts] sync itemAdded - browser', args.item.data);
        } catch (e) {
          // ignore
        }
        this.manager.store.dispatch(addHistoricalContact(args.item.data));
      });
      map.on('itemRemoved', (args) => {
        logger.debug(`[contacts] Map item ${args.key} was removed`);
      });
      map.on('itemUpdated', (args) => {
        logger.debug(`[contacts] Map item ${args.item.key} was updated`);
      });
      map.on('removed', () => {
        this.manager.store.dispatch(clearRecents());
        this.isRecentsInitialized = false;
      });

      // Helper utilities reused from addHistoricalContact (no side-effects yet)
      const isPlaceholder = (val?: string) => !val || ['customer', 'cliente', 'client'].includes(val.toLowerCase());
      const normalizePhone = (val?: string) => (val || '').trim().replace(/[^+0-9]/g, '').replace(/^00/, '+');
      const pendingBackfill: { key: string; updated: HistoricalContact }[] = [];

      const enriched = await Promise.all(
        mapItems.map(async (mapItem) => {
          const original = mapItem.data as HistoricalContact;
            // Defensive: ensure required fields exist
          if (!original.dateTime) {
            (original as any).dateTime = new Date().toISOString();
          }
          if (isPlaceholder(original.name)) {
            try {
              const rawPhones: string[] = [
                (original as any).customerAddress,
                (original as any).inboundAddress,
              ].filter(Boolean) as string[];
              const phoneCandidates = Array.from(new Set([
                ...rawPhones,
                ...rawPhones.map(p => normalizePhone(p)),
                ...rawPhones.map(p => normalizePhone(p).replace(/^[+]/, '')),
              ])).filter(p => p.length >= 6);
              for (const candidate of phoneCandidates) {
                let foundName: string | undefined;
                try {
                  const personal = await this.findContactByPhone(candidate, false);
                  if (personal?.name) foundName = personal.name;
                } catch {}
                if (!foundName) {
                  try {
                    const shared = await this.findContactByPhone(candidate, true);
                    if (shared?.name) foundName = shared.name;
                  } catch {}
                }
                if (foundName) {
                  original.name = foundName;
                  pendingBackfill.push({ key: mapItem.key, updated: original });
                  break;
                }
              }
              if (isPlaceholder(original.name) && phoneCandidates.length > 0) {
                original.name = phoneCandidates[0];
                pendingBackfill.push({ key: mapItem.key, updated: original });
              }
            } catch (err: any) {
              logger.debug('[contacts] enrichment error (initRecents)', { error: err?.message || String(err) });
            }
          }
          return original;
        })
      );

      const contactList = enriched.sort((a, b) => (new Date(a.dateTime) < new Date(b.dateTime) ? 1 : -1));
      try {
        // eslint-disable-next-line no-console
        console.log('[contacts] initRecents initial load - browser', contactList.slice(0, 10));
      } catch (e) {
        // ignore
      }
      if (contactList && contactList.length > 0) {
        this.manager.store.dispatch(initRecents(contactList));
      }
      this.isRecentsInitialized = true;

      // Persist backfill asynchronously (non-blocking)
      if (pendingBackfill.length > 0) {
        (async () => {
          for (const item of pendingBackfill) {
            try {
              await map.set(item.key, item.updated);
              // eslint-disable-next-line no-console
              console.log('[contacts] initRecents backfilled name - browser', { key: item.key, name: item.updated.name });
              logger.debug('[contacts] initRecents backfilled name', { key: item.key, name: item.updated.name });
            } catch (e: any) {
              logger.debug('[contacts] failed to persist backfilled name', { error: e?.message || String(e) });
            }
          }
        })();
      }
    } catch (error: any) {
      logger.error('[contacts] Error loading recent contacts', error);
    }
  };

  initDirectory = async (shared: boolean) => {
    if (!this.workerSid) {
      logger.error('[contacts] Error loading contacts: No worker sid');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
      const mapItems = await getAllSyncMapItems(map);

      // Subscribe to events which trigger Redux updates
      map.on('itemAdded', (args) => {
        this.manager.store.dispatch(addDirectoryContact({ shared, contact: args.item.data }));
      });
      map.on('itemRemoved', (args) => {
        this.manager.store.dispatch(removeDirectoryContact({ shared, key: args.key }));
      });
      map.on('itemUpdated', (args) => {
        this.manager.store.dispatch(updateDirectoryContact({ shared, contact: args.item.data }));
      });

      const contacts = mapItems
        .map((mapItem) => mapItem.data as Contact)
        .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));
      if (contacts && contacts.length > 0) {
        this.manager.store.dispatch(initDirectory({ shared, contacts }));
      }
    } catch (error: any) {
      logger.error('[contacts] Error loading contacts', error);
    }
  };

  initContacts = async () => {
    if (isRecentsEnabled()) {
      await this.initRecents();
    }
    if (isPersonalDirectoryEnabled()) {
      await this.initDirectory(false);
    }
    if (isSharedDirectoryEnabled()) {
      await this.initDirectory(true);
    }
  };

  addHistoricalContact = async (task: Flex.ITask) => {
    const { taskChannelUniqueName: channel, sid: taskSid, queueName, age: duration } = task;
    // DEBUG: log task minimal info to troubleshoot missing customer name
    try {
      logger.debug('[contacts] addHistoricalContact called', {
        sid: taskSid,
        taskChannelUniqueName: channel,
        attributes: task.attributes,
        dateCreated: task.dateCreated,
      });
    } catch (e: any) {
      // ignore logging errors
    }

    // Also print to browser console so we can inspect in the UI devtools
    try {
      // eslint-disable-next-line no-console
      console.log('[contacts] addHistoricalContact called - browser', {
        sid: taskSid,
        taskChannelUniqueName: channel,
        attributes: task.attributes,
        dateCreated: task.dateCreated,
      });
    } catch (e) {
      console.log('Erro:', e);
    }
    const lang = getUserLanguage();
    const dateTime = task.dateCreated.toLocaleString(lang);
    // Enable caller name number lookup on phone number to populate name
    const { direction, from, outbound_to, to, name, channelType, conversations, customerName, customerAddress } =
      task.attributes;

    const twilioAddress = conversations?.external_contact;
    const outcome = conversations?.outcome || 'Completed';
    const notes = conversations?.content;
    // Enhanced name resolution with placeholder + directory lookup
    const isPlaceholder = (val?: string) => !val || ['customer', 'cliente', 'client'].includes(val.toLowerCase());
    const normalizePhone = (val?: string) => (val || '').trim().replace(/[^+0-9]/g, '').replace(/^00/, '+');
    const rawPhones: string[] = [from, outbound_to, customerAddress, to].filter(Boolean) as string[];
    const phoneCandidates = Array.from(new Set([
      ...rawPhones,
      ...rawPhones.map(p => normalizePhone(p)),
      ...rawPhones.map(p => normalizePhone(p).replace(/^\+/, '')),
    ])).filter(p => p.length >= 6);

    let resolvedName: string | undefined = name || customerName;

    const lookupDirectory = async (): Promise<string | undefined> => {
      for (const candidate of phoneCandidates) {
        try {
          const personal = await this.findContactByPhone(candidate, false);
            if (personal?.name) return personal.name;
          const shared = await this.findContactByPhone(candidate, true);
            if (shared?.name) return shared.name;
        } catch {}
      }
      return undefined;
    };

    if (isPlaceholder(resolvedName)) {
      try {
        const dirName = await lookupDirectory();
        if (dirName) resolvedName = dirName;
      } catch (err: any) {
        logger.debug('[contacts] Error looking up contact name by phone', err);
      }
    }
    if (isPlaceholder(resolvedName)) {
      resolvedName = rawPhones[0];
    }

    const contact: HistoricalContact = {
      name: resolvedName,
      direction,
      dateTime,
      taskSid,
      queueName,
      duration,
      outcome,
      notes,
      channelType,
    };

    // DEBUG: log resolved name before saving
    try {
      logger.debug('[contacts] resolved historical contact name', { taskSid, resolvedName, from, outbound_to, customerAddress, customerName });
    } catch (e: any) {
      // ignore
    }

    // Also surface resolved name to browser console for quick inspection in DevTools
    try {
      // eslint-disable-next-line no-console
      console.log('[contacts] resolved historical contact name - browser', { taskSid, resolvedName, from, outbound_to, customerAddress, customerName });
    } catch (e) {
      // ignore
    }

    if (channel === 'voice') {
      contact.channelType = channel;
    }

    if (direction === 'inbound') {
      contact.customerAddress = from || customerAddress;
      contact.inboundAddress = to || twilioAddress;
    } else {
      contact.customerAddress = outbound_to;
      contact.inboundAddress = from;
    }

    // add item to the sync map
    if (!this.workerSid) {
      logger.error('[contacts] Error adding to recent contacts: No worker sid');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_RECENT_KEY}_${this.workerSid}`);
      await map.set(contact.taskSid, contact, { ttl: getRecentDaysToKeep() * 86400 });
      if (!this.isRecentsInitialized) {
        this.initRecents();
      }
    } catch (error: any) {
      logger.error('[contacts] Error adding to recent contacts', error);
    }
  };

  clearRecents = async () => {
    if (!this.workerSid) {
      logger.error('[contacts] Error clearing recent contacts: No worker sid');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_RECENT_KEY}_${this.workerSid}`);
      await map.removeMap();
    } catch (error: any) {
      logger.error('[contacts] Error clearing recent contacts', error);
    }
  };

  addContact = async (
    name: string,
    phoneNumber: string,
    notes: string,
    shared: boolean,
    allowColdTransfer?: boolean,
    allowWarmTransfer?: boolean,
  ) => {
    // Only supervisors/admin can add contacts (personal or shared)
    if (!this.isSupervisor()) {
      logger.error('[contacts] User not authorized to add contact');
      return;
    }
    if (!this.workerSid && !shared) {
      logger.error('[contacts] Error adding contact: No worker sid');
      return;
    }
    if (shared && !this.canEditShared()) {
      logger.error('[contacts] User not authorized to modify shared contacts');
      return;
    }
    try {
      const contact: Contact = {
        key: uuidv4(),
        name,
        phoneNumber,
        notes,
      };
      if (shared) {
        contact.allowColdTransfer = allowColdTransfer ?? true;
        contact.allowWarmTransfer = allowWarmTransfer ?? true;
      }
      const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
      await map.set(contact.key, contact);
    } catch (error: any) {
      logger.error('[contacts] Error adding contact', error);
    }
  };

  addContactFull = async (contact: Contact, shared: boolean) => {
    if (!this.isSupervisor()) {
      logger.error('[contacts] User not authorized to add contact');
      return;
    }
    if (!this.workerSid && !shared) {
      logger.error('[contacts] Error adding contact: No worker sid');
      return;
    }
    if (shared && !this.canEditShared()) {
      logger.error('[contacts] User not authorized to modify shared contacts');
      return;
    }
    try {
      // Garante que exista uma key única
      if (!contact.key) {
        contact.key = uuidv4();
      }
      const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
      await map.set(contact.key, contact);
    } catch (error: any) {
      logger.error('[contacts] Error adding contact', error);
    }
  };

  findContactByPhone = async (phoneNumber: string, shared: boolean): Promise<Contact | undefined> => {
    const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
    const items = await getAllSyncMapItems(map);
    return items.map(i => i.data as Contact).find(c => c.phoneNumber === phoneNumber);
  };

  addOrUpdateContactFull = async (contact: Contact, shared: boolean) => {
    if (!this.isSupervisor()) {
      logger.error('[contacts] User not authorized to add/update contact');
      return;
    }
    if (!this.workerSid && !shared) {
      logger.error('[contacts] Error adding contact: No worker sid');
      return;
    }
    if (shared && !this.canEditShared()) {
      logger.error('[contacts] User not authorized to modify shared contacts');
      return;
    }
    try {
      // Verifica duplicidade pelo telefone
      let existing;
      if (contact.phoneNumber) {
        existing = await this.findContactByPhone(contact.phoneNumber, shared);
      }
      if (existing) {
        contact.key = existing.key; // Mantém a key original
        await this.updateContact(contact, shared);
        return contact;
      } else {
        if (!contact.key) contact.key = uuidv4();
        const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
        await map.set(contact.key, contact);
      }
    } catch (error: any) {
      logger.error('[contacts] Error adding/updating contact', error);
    }
  };

  deleteContact = async (key: string, shared: boolean) => {
    if (!this.isSupervisor()) {
      logger.error('[contacts] User not authorized to remove contact');
      return;
    }
    if (!this.workerSid && !shared) {
      logger.error('[contacts] Error removing contact: No worker sid');
      return;
    }
    if (shared && !this.canEditShared()) {
      logger.error('[contacts] User not authorized to modify shared contacts');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
      await map.remove(key);
    } catch (error: any) {
      logger.error('[contacts] Error removing contact', error);
    }
  };

  updateContact = async (contact: Contact, shared: boolean) => {
    if (!this.isSupervisor()) {
      logger.error('[contacts] User not authorized to update contact');
      return;
    }
    if (!this.workerSid && !shared) {
      logger.error('[contacts] Error updating contact: No worker sid');
      return;
    }
    if (shared && !this.canEditShared()) {
      logger.error('[contacts] User not authorized to modify shared contacts');
      return;
    }
    try {
      const map = await SyncClient.map(`${CONTACTS_KEY}_${shared ? this.accountSid : this.workerSid}`);
      await map.set(contact.key, contact);
    } catch (error: any) {
      logger.error('[contacts] Error updating contact', error);
    }
  };

  shouldShowTransferOptions = (shared: boolean) =>
    shared &&
    getLoadedFeatures().includes('custom-transfer-directory') &&
    (getFeatureFlags()?.features?.custom_transfer_directory?.external_directory?.enabled || false);
}

const contactsUtil = new ContactsUtil();

export default contactsUtil;
