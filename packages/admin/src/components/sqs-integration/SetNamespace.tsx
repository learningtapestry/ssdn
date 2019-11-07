import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

export interface SetNamespaceProps {
  show: boolean;
  onClose: () => void;
  onNamespaceSaved: () => void;
}

export default function SetNamespace(props: SetNamespaceProps) {
  const { show, onClose, onNamespaceSaved } = props;
  const [functionNamespace, setFunctionNamespace] = useState("");

  useEffect(() => {
    fetchData();
  }, [show]);

  const fetchData = async () => {
    setFunctionNamespace(await AWSService.retrieveSQSIntegrationNamespace());
  };

  const handleChangeFunctionNamespace = (event: React.ChangeEvent<HTMLInputElement>) =>
    setFunctionNamespace(event.target.value);

  const handleConfirmSetNamespace = async () => {
    await AWSService.updateNamespace(functionNamespace);
    onNamespaceSaved();
  };

  return (
    <ConfirmationModal
      title="Set Namespace"
      show={show}
      onConfirm={handleConfirmSetNamespace}
      onClose={onClose}
    >
      <div>
        <Form.Label>Enter the namespace that will be set for the received SQS messages.</Form.Label>
        <Form.Control
          type="text"
          data-testid="functionNamespace"
          onChange={handleChangeFunctionNamespace}
          value={functionNamespace}
        />
      </div>
    </ConfirmationModal>
  );
}
