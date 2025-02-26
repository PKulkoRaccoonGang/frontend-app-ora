import React from 'react';

import { stepNames } from 'constants/index';

import * as reduxHooks from 'data/redux/hooks';
import * as lmsSelectors from 'data/services/lms/hooks/selectors';
import * as lmsActions from 'data/services/lms/hooks/actions';
import * as routingHooks from './routing';

const useIsCriterionFeedbackInvalid = () => {
  const viewStep = routingHooks.useViewStep();
  const criteriaConfig = lmsSelectors.useCriteriaConfig();
  return ({ value, criterionIndex }) => {
    const config = criteriaConfig[criterionIndex];
    return viewStep !== stepNames.studentTraining
      && value === ''
      && config.feedbackRequired;
  };
};

const useTrainingOptionValidity = (criterionIndex) => {
  const value = reduxHooks.useCriterionOption(criterionIndex);
  const expected = (lmsSelectors.useStepInfo().studentTraining || {}).expectedRubricSelections;
  if (!value || !expected || expected[criterionIndex] === null) {
    return null;
  }
  return `${expected[criterionIndex]}` === value ? 'valid' : 'invalid';
};

export const useCriterionOptionFormFields = (criterionIndex) => {
  const value = reduxHooks.useCriterionOption(criterionIndex);
  const setOption = reduxHooks.useSetCriterionOption(criterionIndex);
  const setShowTrainingError = reduxHooks.useSetShowTrainingError();
  const isInvalid = value === null;
  return {
    value,
    onChange: (e) => {
      setShowTrainingError(false);
      setOption(e.target.value);
    },
    isInvalid,
    trainingOptionValidity: useTrainingOptionValidity(criterionIndex),
  };
};

export const useCriterionFeedbackFormFields = (criterionIndex) => {
  const value = reduxHooks.useCriterionFeedback(criterionIndex);
  const setFeedback = reduxHooks.useSetCriterionFeedback(criterionIndex);
  const isInvalid = useIsCriterionFeedbackInvalid()({
    value, criterionIndex,
  });
  return { value, onChange: (e) => setFeedback(e.target.value), isInvalid };
};
export const useOverallFeedbackFormFields = () => {
  const value = reduxHooks.useOverallFeedbackValue();
  const setFeedback = reduxHooks.useSetOverallFeedback();
  return { value, onChange: (e) => setFeedback(e.target.value) };
};

export const useIsAssessmentInvalid = () => {
  const assessment = reduxHooks.useFormFields();
  const criteriaConfig = lmsSelectors.useCriteriaConfig();
  const isFeedbackInvalid = useIsCriterionFeedbackInvalid();
  if (!assessment.criteria.length) {
    return false;
  }
  return criteriaConfig.some(
    (c, criterionIndex) => {
      const { feedback, selectedOption } = assessment.criteria[criterionIndex];
      return (
        selectedOption === null
        || isFeedbackInvalid({ value: feedback, criterionIndex })
      );
    },
  );
};

export const useCheckTrainingSelection = () => {
  const assessment = reduxHooks.useFormFields();
  const expected = (lmsSelectors.useStepInfo().studentTraining || {}).expectedRubricSelections;
  if (!expected || !assessment) {
    return true;
  }
  return assessment.criteria.every(
    (criterion, criterionIndex) => (
      !expected || `${expected[criterionIndex]}` === criterion.selectedOption
    ),
  );
};
export const useInitializeAssessment = () => {
  const emptyRubric = lmsSelectors.useEmptyRubric();
  const setFormFields = reduxHooks.useSetFormFields();
  const setResponse = reduxHooks.useSetResponse();
  const response = lmsSelectors.useResponseData();
  React.useEffect(() => {
    setResponse(response);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return React.useCallback(() => {
    setFormFields(emptyRubric);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export const useOnSubmit = () => {
  const setAssessment = reduxHooks.useLoadAssessment();
  const setShowValidation = reduxHooks.useSetShowValidation();
  const setShowTrainingError = reduxHooks.useSetShowTrainingError();
  const setHasSubmitted = reduxHooks.useSetHasSubmitted();

  const isInvalid = useIsAssessmentInvalid();
  const checkTrainingSelection = useCheckTrainingSelection();

  const viewStep = routingHooks.useViewStep();
  const formFields = reduxHooks.useFormFields();
  const submitAssessmentMutation = lmsActions.useSubmitAssessment({ onSuccess: setAssessment });

  return {
    onSubmit: React.useCallback(() => {
      if (isInvalid) {
        return setShowValidation(true);
      }
      if (viewStep === stepNames.studentTraining && !checkTrainingSelection) {
        return setShowTrainingError(true);
      }
      return submitAssessmentMutation.mutateAsync({
        ...formFields,
        step: viewStep,
      }).then((data) => {
        setAssessment(data);
        setHasSubmitted(true);
      });
    }, [
      viewStep,
      formFields,
      isInvalid,
      setShowValidation,
      checkTrainingSelection,
      submitAssessmentMutation,
      setAssessment,
      setShowTrainingError,
      setHasSubmitted,
    ]),
    status: submitAssessmentMutation.status,
  };
};

export const useResetAssessment = () => {
  const reset = reduxHooks.useResetAssessment();
  const setFormFields = reduxHooks.useSetFormFields();
  const emptyRubric = lmsSelectors.useEmptyRubric();
  return () => {
    reset();
    setFormFields(emptyRubric);
  };
};

export const {
  useHasSubmitted,
  useResponse,
  useSetResponse,
  useSetHasSubmitted,
  useSetShowValidation,
  useShowValidation,
  useShowTrainingError,
  useSubmittedAssessment,
} = reduxHooks;

export const {
  useOverallFeedbackPrompt,
  useCriteriaConfig,
  useEmptyRubric,
} = lmsSelectors;
