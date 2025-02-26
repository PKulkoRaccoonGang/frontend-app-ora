import { useViewStep } from 'hooks/routing';
import { useGlobalState, useStepInfo } from 'hooks/app';
import { useHasSubmitted } from 'hooks/assessment';
import { useStartStepAction, useLoadNextAction } from 'hooks/actions';

import { stepNames, stepStates } from 'constants/index';

import messages from '../messages';
import { alertTypes } from './constants';
import useCreateAlert from './useCreateAlert';
import { useCreateExitAlert } from './simpleAlerts';

const useSuccessAlerts = ({ step }) => {
  const { activeStepName, activeStepState } = useGlobalState({ step });
  const viewStep = useViewStep();
  const hasSubmitted = useHasSubmitted();
  const startStepAction = useStartStepAction();
  const loadNextAction = useLoadNextAction();
  const stepInfo = useStepInfo();
  const exitAlert = useCreateExitAlert({ step });
  const createAlert = useCreateAlert({ step });

  const out = [];
  if (hasSubmitted) {
    const successAlert = {
      message: messages.alerts[viewStep].submitted,
      heading: messages.headings[viewStep].submitted,
      ...alertTypes.success,
    };
    if (activeStepState === stepStates.inProgress) {
      if (activeStepName !== viewStep) {
        successAlert.actions = [startStepAction.action];
      } else if (viewStep === stepNames.peer) {
        successAlert.actions = [loadNextAction.action];
      }
    } else if (activeStepState === stepStates.waitingForPeerGrades && !stepInfo.peer.isWaitingForSubmissions) {
      successAlert.actions = [loadNextAction.action];
    }

    if (activeStepState !== stepStates.inProgress) {
      out.push(exitAlert(activeStepState));
    } else {
      out.push(createAlert(successAlert));
    }
    if (activeStepName === stepNames.staff) {
      out.push(exitAlert(stepNames.staff));
    }
  }
  return out;
};

export default useSuccessAlerts;
