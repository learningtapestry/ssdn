import find from "lodash/fp/find";
import isEmpty from "lodash/fp/isEmpty";
import React, { Fragment, useEffect, useState } from "react";
import { Badge, ButtonGroup, Table } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { nullQueue } from "../../app-helper";
import QueueMapping from "../../interfaces/queueMapping";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";
import AssociateQueue from "./AssociateQueue";
import SetNamespace from "./SetNamespace";

export default function SQSIntegration() {
  const [queueMappings, setQueueMappings] = useState<QueueMapping[]>([]);
  const [selectedQueueMapping, setSelectedQueueMapping] = useState<QueueMapping>(nullQueue());
  const [showAssociateQueueModal, setShowAssociateQueueModal] = useState(false);
  const [showSetNamespaceModal, setShowSetNamespaceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setQueueMappings(await AWSService.retrieveQueueMappings());
  };

  const handleClickOpenAssociateQueueModal = () => setShowAssociateQueueModal(true);

  const handleClickOpenSetNamespaceModal = () => setShowSetNamespaceModal(true);

  const handleClickOpenDeleteModal = (event: React.MouseEvent<HTMLElement>) => {
    const data = (event.target as HTMLElement).dataset;
    const queue = find({ arn: data.arn })(queueMappings) as QueueMapping;
    setSelectedQueueMapping(queue);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleCloseAssociateQueueModal = () => setShowAssociateQueueModal(false);

  const handleCloseSetNamespaceModal = () => setShowSetNamespaceModal(false);

  const handleClickDisableQueueMapping = async (event: React.MouseEvent<HTMLElement>) => {
    await AWSService.disableQueueMapping((event.target as HTMLElement).dataset.uuid!);
    await fetchData();
  };

  const handleClickEnableQueueMapping = async (event: React.MouseEvent<HTMLElement>) => {
    await AWSService.enableQueueMapping((event.target as HTMLElement).dataset.uuid!);
    await fetchData();
  };

  const handleAssociationCreated = async () => {
    setShowAssociateQueueModal(false);
    await fetchData();
  };

  const handleNamespaceSaved = () => setShowSetNamespaceModal(false);

  const handleConfirmDeleteQueueMapping = async () => {
    await AWSService.deleteQueueMapping(selectedQueueMapping.uuid);
    setShowDeleteModal(false);
    await fetchData();
  };

  const renderEmpty = () => (
    <p className="mt-3">Your SSDN instance is not currently associated with any SQS queue.</p>
  );

  const renderList = () => (
    <Fragment>
      <p className="mt-3">
        Your SSDN instance is currently associated with the following SQS queues:
      </p>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>ARN</th>
            <th>Last Modified</th>
            <th>State</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderQueues()}</tbody>
      </Table>
    </Fragment>
  );

  const statusHandler = (status: string) =>
    status === "Enabled" ? handleClickDisableQueueMapping : handleClickEnableQueueMapping;

  const renderQueues = () =>
    queueMappings.map((queue) => (
      <tr key={queue.uuid}>
        <td>{queue.arn}</td>
        <td>{queue.modificationDate.toLocaleString()}</td>
        <td>
          <Badge pill={true} variant={queue.status === "Enabled" ? "success" : "primary"}>
            {queue.status}
          </Badge>
        </td>
        <td>
          <ButtonGroup>
            <Button
              variant="outline-success"
              data-uuid={queue.uuid}
              disabled={!["Enabled", "Disabled"].includes(queue.status)}
              onClick={statusHandler(queue.status)}
            >
              {queue.status === "Disabled" ? "Enable" : "Disable"}
            </Button>
            <Button
              variant="outline-danger"
              disabled={!["Enabled", "Disabled"].includes(queue.status)}
              size="sm"
              data-arn={queue.arn}
              onClick={handleClickOpenDeleteModal}
            >
              Delete
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    ));

  return (
    <section id="admin-sqs-integration">
      <h1>SQS Integration</h1>
      <p>
        Here you can integrate your SSDN instance with AWS SQS, and import all the content that goes
        through your chosen SQS queues into SSDN.
      </p>
      <ButtonGroup>
        <Button variant="outline-primary" onClick={handleClickOpenAssociateQueueModal}>
          Associate Queue
        </Button>
        <Button variant="outline-primary" onClick={handleClickOpenSetNamespaceModal}>
          Set Namespace
        </Button>
      </ButtonGroup>
      {isEmpty(queueMappings) ? renderEmpty() : renderList()}
      <AssociateQueue
        show={showAssociateQueueModal}
        onClose={handleCloseAssociateQueueModal}
        onAssociationCreated={handleAssociationCreated}
        queueMappings={queueMappings}
      />
      <SetNamespace
        show={showSetNamespaceModal}
        onClose={handleCloseSetNamespaceModal}
        onNamespaceSaved={handleNamespaceSaved}
      />
      <ConfirmationModal
        title="Confirm queue deletion"
        show={showDeleteModal}
        onConfirm={handleConfirmDeleteQueueMapping}
        onClose={handleCloseDeleteModal}
      >
        <div>
          <p>Do you want to delete the integration with the queue '{selectedQueueMapping.arn}'?</p>
          <p>The SQS queue itself won't be affected.</p>
        </div>
      </ConfirmationModal>
    </section>
  );
}
