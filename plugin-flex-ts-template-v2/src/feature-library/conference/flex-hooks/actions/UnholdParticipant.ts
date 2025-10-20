import * as Flex from '@twilio/flex-ui';

import ProgrammableVoiceService from '../../../../utils/serverless/ProgrammableVoice/ProgrammableVoiceService';
import { isConferenceEnabledWithoutNativeXWT } from '../../config';
import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';
import logger from '../../../../utils/logger';

export const actionEvent = FlexActionEvent.before;
export const actionName = FlexAction.UnholdParticipant;
export const actionHook = function handleUnholdConferenceParticipant(flex: typeof Flex, _manager: Flex.Manager) {
  if (!isConferenceEnabledWithoutNativeXWT()) return;

  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload) => {
    const { participantType, targetSid: participantSid } = payload;

    if (participantType !== 'unknown') {
      return;
    }

    // Let Flex handle the unhold action natively (Flex UI 2.x)
    // Do not abort or call service directly - Flex Actions API handles this
    logger.info(`[conference] Unholding participant ${participantSid} via Flex Actions`);
  });
};
