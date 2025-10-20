import * as Flex from '@twilio/flex-ui';

import ProgrammableVoiceService from '../../../../utils/serverless/ProgrammableVoice/ProgrammableVoiceService';
import { getHoldMusicUrl } from '../../config';
import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';
import logger from '../../../../utils/logger';

export const actionEvent = FlexActionEvent.before;
export const actionName = FlexAction.HoldParticipant;
export const actionHook = function setHoldMusicBeforeHoldParticipant(flex: typeof Flex, _manager: Flex.Manager) {
  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload) => {
    // Set custom hold music URL
    payload.holdMusicUrl = getHoldMusicUrl();

    if (!payload.targetSid || !payload.task) {
      return;
    }

    // Find the full participant object based on the targetSid
    const participant = payload?.task?.conference?.participants?.find(
      (p: any) => payload.targetSid === (payload.targetSid.startsWith('UT') ? p.participantSid : p.callSid),
    );

    // Only Native XWT participants are of the 'external' type
    if (!participant || participant.participantType !== 'external') {
      return;
    }

    // Let Flex Actions API handle the hold operation with custom hold music (Flex UI 2.x)
    logger.info(`[custom-hold-music] Holding participant ${participant.callSid} with custom music`);
  });
};
