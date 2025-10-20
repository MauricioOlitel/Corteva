import * as Flex from '@twilio/flex-ui';

import ProgrammableVoiceService from '../../../../utils/serverless/ProgrammableVoice/ProgrammableVoiceService';
import { isInternalCall } from '../../helpers/internalCall';
import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';

export const actionEvent = FlexActionEvent.before;
export const actionName = FlexAction.HoldCall;
export const actionHook = function handleInternalHoldCall(flex: typeof Flex, _manager: Flex.Manager) {
  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload, abortFunction) => {
    if (!isInternalCall(payload.task)) {
      return;
    }

    const { task } = payload;
    const conference = task.conference ? task.conference.conferenceSid : task.attributes.conferenceSid;

    const participant = task.attributes.conference.participants
      ? task.attributes.conference.participants.worker
      : task.attributes.worker_call_sid;

    // Use Flex Actions API instead of direct service call (Flex UI 2.x)
    await flex.Actions.invokeAction('HoldParticipant', {
      sid: conference,
      targetSid: participant,
      task,
    });
    abortFunction();
  });
};
