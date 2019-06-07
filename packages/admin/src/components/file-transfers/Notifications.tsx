import capitalize from "lodash/fp/capitalize";
import find from "lodash/fp/find";
import React, { useCallback, useEffect, useState } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import { displayDate, nullFileTransferNotification } from "../../app-helper";
import {
  FileTransferNotification,
  FileTransferNotificationType,
} from "../../interfaces/file-transfer-notification";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";

export default function Notifications() {
  const [notifications, setNotifications] = useState<FileTransferNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<FileTransferNotification>(
    nullFileTransferNotification(),
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setNotifications(await AWSService.retrieveFileTransferNotifications());
  };

  const handleDelete = useCallback(async () => {
    await AWSService.deleteFileTransferNotification(selectedNotification.id);
    setShowDeleteModal(false);
    await fetchData();
  }, [selectedNotification]);

  const handleOpenDeleteModal = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      target.dataset.modal === "details" ? setShowDetailsModal(true) : setShowDeleteModal(true);
      const notification = find({ id: target.dataset.id })(
        notifications,
      ) as FileTransferNotification;
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
        <td className={typeClass(notification.type)}>{capitalize(notification.type)}</td>
        <td>{displayDate(notification.creationDate)}</td>
        <td>{notification.subject}</td>
        <td>{notification.message}</td>
        <td>{notification.bucket}</td>
        <td>{notification.file}</td>
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

  const typeClass = (type: FileTransferNotificationType) => {
    return type === FileTransferNotificationType.Error ? "text-danger" : "text-primary";
  };

  const renderDetailsButton = (notification: FileTransferNotification) => {
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
      <p>
        Here you can examine all the notifications derived from the S3 file transfer operations.
      </p>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Type</th>
            <th>Creation Date</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Bucket</th>
            <th>File</th>
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
