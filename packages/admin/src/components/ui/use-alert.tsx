import React, { Dispatch, SetStateAction, useState } from "react";
import { Alert } from "react-bootstrap";

import { ColorVariant } from "./base-types";

type AlertState = { message: string; variant: ColorVariant } | undefined;

// tslint:disable: no-empty
const useAlert = (): [
  AlertState,
  Dispatch<SetStateAction<AlertState>>,
  (...args: any[]) => any,
  (...args: any[]) => any
] => {
  const [alertContent, setAlertContent] = useState<AlertState>(undefined);

  const renderAlert = () => {
    if (alertContent) {
      const closeAlert = () => setAlertContent(undefined);
      return (
        <Alert variant={alertContent.variant} dismissible={true} onClose={closeAlert}>
          {alertContent.message}
        </Alert>
      );
    }
  };

  const showOnError = (fn: () => Promise<void>) => {
    return async () => {
      try {
        await fn();
      } catch (error) {
        setAlertContent({ message: error.message, variant: "danger" });
      }
    };
  };

  return [alertContent, setAlertContent, renderAlert, showOnError];
};
// tslint:enable: no-empty

export default useAlert;
