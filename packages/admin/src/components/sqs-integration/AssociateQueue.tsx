import difference from "lodash/fp/difference";
import map from "lodash/fp/map";
import React, { Fragment, useEffect, useState } from "react";
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
  const [externalQueue, setExternalQueue] = useState(false);
  const [error, setError] = useState(undefined);

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
      try {
        await AWSService.createQueueMapping(selectedQueue);
        onAssociationCreated();
      } catch (error) {
        setError(error.message);
      }
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
        <Form.Group controlId="externalAccount">
          <Form.Check
            type="checkbox"
            label="Queue resides in external AWS account?"
            defaultChecked={externalQueue}
            onChange={() => setExternalQueue(!externalQueue)}
          />
        </Form.Group>
        <Form.Group controlId="queueArn">
          {externalQueue ? (
            <Fragment>
              <Form.Control
                type="text"
                onChange={handleChangeSelectedQueue}
                placeholder="Enter the ARN of the queue"
                isInvalid={error}
              />
              <p className="mt-3">
                <small>
                  Before associating an external SQS queue, please make sure your AWS account has
                  the required access permissions. More specifically, the <em>ReceiveMessage</em>,{" "}
                  <em>DeleteMessage</em> and <em>GetQueueAttributes</em> permissions are needed.
                  Check out the official documentation on how to add a{" "}
                  <a href="https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-creating-custom-policies.html#sqs-creating-custom-policies-key-concepts">
                    custom policy for SQS access
                  </a>
                  .
                </small>
              </p>
            </Fragment>
          ) : (
            <Fragment>
              <Form.Label>Select the SQS queue you want to associate</Form.Label>
              <Form.Control as="select" onChange={handleChangeSelectedQueue} isInvalid={error}>
                {renderAvailableQueues()}
              </Form.Control>
            </Fragment>
          )}
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        </Form.Group>
      </div>
    </ConfirmationModal>
  );
}
