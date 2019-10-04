import difference from "lodash/fp/difference";
import map from "lodash/fp/map";
import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";

import QueueMapping from "../../interfaces/queueMapping";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

export interface AssociateQueueProps {
  show: boolean;
  onClose: () => void;
  onAssociationCreated: () => void;
  queueMappings: QueueMapping[];
}

export default function AssociateQueue(props: AssociateQueueProps) {
  const { show, onClose, onAssociationCreated, queueMappings } = props;
  const [availableQueues, setAvailableQueues] = useState<string[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const allQueues = await AWSService.retrieveQueues();
      const associatedQueues = map("arn")(queueMappings);
      const assignableQueues = difference(allQueues)(associatedQueues) as string[];
      setAvailableQueues(assignableQueues);
      setSelectedQueue(assignableQueues[0]);
    };

    fetchData();
  }, [queueMappings]);

  const handleChangeSelectedQueue = (event: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedQueue(event.target.value);

  const handleConfirmAssociateQueue = async () => {
    if (selectedQueue) {
      await AWSService.createQueueMapping(selectedQueue);
      onAssociationCreated();
    }
  };

  const renderAvailableQueues = () =>
    availableQueues.map((queue: string) => <option key={queue}>{queue}</option>);

  return (
    <ConfirmationModal
      title="Associate SQS Queue"
      show={show}
      onConfirm={handleConfirmAssociateQueue}
      onClose={onClose}
    >
      <div>
        <Form.Label>Select the SQS Queue you want to associate</Form.Label>
        <Form.Control as="select" onChange={handleChangeSelectedQueue}>
          {renderAvailableQueues()}
        </Form.Control>
      </div>
    </ConfirmationModal>
  );
}
