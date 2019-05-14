import find from "lodash/fp/find";
import React, { useEffect, useState } from "react";
import { ButtonGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import { nullConnectionRequest } from "../../app-helper";
import { ConnectionRequest, ConnectionRequestStatus } from "../../interfaces/connection-request";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";
import useAlert from "../ui/use-alert";
import useModal from "../ui/use-modal";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { StatusLabel } from "./StatusLabel";

export default function Incoming() {
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selectedConnectionRequest, setSelectedConnectionRequest] = useState<ConnectionRequest>(
    nullConnectionRequest(),
  );

  const [alertContent, setAlertContent, renderAlert, showOnError] = useAlert();

  const selectConnectionRequest = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const connectionRequest = find({ id: target.dataset.connectionRequest })(
      connectionRequests,
    ) as ConnectionRequest;
    setSelectedConnectionRequest(connectionRequest);
  };

  const [
    showViewInfoModal,
    setShowViewInfoModal,
    openViewInfoModal,
    handleCloseViewInfoModal,
  ] = useModal([selectConnectionRequest, [connectionRequests]]);

  const [
    showConfirmAccept,
    setShowConfirmAccept,
    openConfirmAccept,
    handleCloseConfirmAccept,
  ] = useModal([selectConnectionRequest, [connectionRequests]]);

  const [
    showConfirmReject,
    setShowConfirmReject,
    openConfirmReject,
    handleCloseConfirmReject,
  ] = useModal([selectConnectionRequest, [connectionRequests]]);

  const [triggerRefresh, setTriggerRefresh] = useState(false);

  useEffect(() => {
    fetchData();
  }, [triggerRefresh]);

  const fetchData = async () => {
    const receivedRequests = await AWSService.retrieveConnectionRequests("incoming");
    setConnectionRequests(receivedRequests);
  };

  const handleConfirmAccept = showOnError(async () => {
    await AWSService.acceptConnectionRequest(
      selectedConnectionRequest.consumerEndpoint,
      selectedConnectionRequest.id,
      true,
    );
    setShowConfirmAccept(false);
    setTriggerRefresh(!triggerRefresh);
  });

  const handleConfirmReject = showOnError(async () => {
    await AWSService.acceptConnectionRequest(
      selectedConnectionRequest.consumerEndpoint,
      selectedConnectionRequest.id,
      false,
    );
    setShowConfirmReject(false);
    setTriggerRefresh(!triggerRefresh);
  });

  // tslint:disable: jsx-wrap-multiline
  const requestButtons = (request: ConnectionRequest) => {
    if (request.status === ConnectionRequestStatus.Created) {
      return (
        <ButtonGroup>
          <Button
            variant="outline-success"
            size="sm"
            data-connection-request={request.id}
            data-status="accepted"
            onClick={openConfirmAccept}
          >
            Accept
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            data-connection-request={request.id}
            data-status="rejected"
            onClick={openConfirmReject}
          >
            Reject
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            data-connection-request={request.id}
            onClick={openViewInfoModal}
          >
            View info
          </Button>
        </ButtonGroup>
      );
    }
    return (
      <ButtonGroup>
        <Button
          variant="outline-primary"
          size="sm"
          data-connection-request={request.id}
          onClick={openViewInfoModal}
        >
          View info
        </Button>
      </ButtonGroup>
    );
  };

  const renderedConnectionRequests = connectionRequests.map((request) => (
    <tr key={request.id}>
      <td>{request.consumerEndpoint}</td>
      <td>{request.organization}</td>
      <td>{new Date(request.creationDate).toLocaleDateString("en-US")}</td>
      <td>{request.email}</td>
      <td>
        <StatusLabel status={request.status} statusType="incoming" />
      </td>
      <td>{requestButtons(request)}</td>
    </tr>
  ));

  return (
    <section id={`admin-consumers`}>
      <h1>Incoming Requests</h1>
      <p>This section displays incoming connection requests from other instances.</p>
      {renderAlert()}
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Organization</th>
            <th>Creation Date</th>
            <th>Email</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderedConnectionRequests}</tbody>
      </Table>
      <ConnectionRequestModal
        connectionRequest={selectedConnectionRequest}
        show={showViewInfoModal}
        onClose={handleCloseViewInfoModal}
      />
      <ConfirmationModal
        title="Confirm connection request"
        show={showConfirmAccept}
        onConfirm={handleConfirmAccept}
        onClose={handleCloseConfirmAccept}
      >
        <p>
          Do you confirm the connection request should be <strong>accepted</strong>?
        </p>
      </ConfirmationModal>
      <ConfirmationModal
        title="Confirm connection request"
        show={showConfirmReject}
        onConfirm={handleConfirmReject}
        onClose={handleCloseConfirmReject}
      >
        <p>
          Do you confirm the connection request should be <strong>rejected</strong>?
        </p>
      </ConfirmationModal>
    </section>
  );
}
