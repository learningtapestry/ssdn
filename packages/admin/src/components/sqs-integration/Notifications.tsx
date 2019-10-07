import find from "lodash/fp/find";
import React, { useCallback, useEffect, useState } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";

import { displayDate, nullSQSIntegrationNotification } from "../../app-helper";
import { SQSIntegrationNotification } from "../../interfaces/sqs-integration-notification";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

export default function Notifications() {
  const [notifications, setNotifications] = useState<SQSIntegrationNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<SQSIntegrationNotification>(
    nullSQSIntegrationNotification(),
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setNotifications(await AWSService.retrieveSQSIntegrationNotifications());
  };

  const handleDelete = useCallback(async () => {
    await AWSService.deleteSQSIntegrationNotification(selectedNotification.id);
    setShowDeleteModal(false);
    await fetchData();
  }, [selectedNotification]);

  const handleOpenDeleteModal = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      target.dataset.modal === "details" ? setShowDetailsModal(true) : setShowDeleteModal(true);
      const notification = find({ id: target.dataset.id })(
        notifications,
      ) as SQSIntegrationNotification;
      setSelectedNotification(notification);
    },
    [notifications],
  );

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setShowDetailsModal(false);
  }, []);

  const renderNotifications = () =>
    notifications.map((notification) => (
      <tr key={notification.id}>
        <td>{displayDate(notification.creationDate)}</td>
        <td>{notification.subject}</td>
        <td>{notification.message}</td>
        <td>{notification.queue}</td>
        <td>
          <ButtonGroup>
            {renderDetailsButton(notification)}
            <Button
              variant="outline-danger"
              size="sm"
              data-modal="delete"
              data-id={notification.id}
              onClick={handleOpenDeleteModal}
            >
              Delete
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    ));

  const renderDetailsButton = (notification: SQSIntegrationNotification) => {
    if (notification.details) {
      return (
        <Button
          variant="outline-primary"
          size="sm"
          data-modal="details"
          data-id={notification.id}
          onClick={handleOpenDeleteModal}
        >
          Details
        </Button>
      );
    }
  };

  return (
    <section id="admin-file-transfers-notifications">
      <h1>Notifications</h1>
      <p>Here you can examine all the notifications derived from the SQS integration operations.</p>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Creation Date</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Queue</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderNotifications()}</tbody>
      </Table>
      <ConfirmationModal
        title="Confirm delete"
        show={showDeleteModal}
        onConfirm={handleDelete}
        onClose={handleCloseDeleteModal}
      >
        <p>Are you sure you want to delete notification '{selectedNotification.subject}'?</p>
      </ConfirmationModal>
      <ConfirmationModal
        title="Notification Details"
        show={showDetailsModal}
        closeLabel="Close"
        onClose={handleCloseDeleteModal}
      >
        <p>
          <code>{selectedNotification.details}</code>
        </p>
      </ConfirmationModal>
    </section>
  );
}
