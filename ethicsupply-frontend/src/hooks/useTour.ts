import { useState, useCallback } from "react";

export type TourStep = {
  id: string;
  targetSelector: string;
  title: string;
  icon: string;
  whereFrom: string;
  whyMatters: string;
  whatToDo: string;
};

export function useTour(steps: TourStep[]) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    document.body.style.overflow = "hidden";
  }, []);

  const exit = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    document.body.style.overflow = "";
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => {
      if (s < steps.length - 1) return s + 1;
      return s;
    });
  }, [steps.length]);

  const prev = useCallback(() => {
    setCurrentStep((s) => (s > 0 ? s - 1 : s));
  }, []);

  const finish = useCallback(() => {
    exit();
  }, [exit]);

  return { isActive, currentStep, start, exit, next, prev, finish, steps };
}
