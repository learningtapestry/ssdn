import find from "lodash/fp/find";
import React, { useEffect, useState } from "react";
import { Alert, ButtonGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Table from "react-bootstrap/Table";
import { LinkContainer } from "react-router-bootstrap";

import { nullConnectionRequest } from "../../app-helper";
import { ConnectionRequest } from "../../interfaces/connection-request";
import AWSService from "../../services/aws-service";
import { ColorVariant } from "../ui/base-types";
import useModal from "../ui/use-modal";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { StatusLabel } from "./StatusLabel";

export default function Submitted() {
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selectedConnectionRequest, setSelectedConnectionRequest] = useState<ConnectionRequest>(
    nullConnectionRequest(),
  );
  const [triggerRefresh, setTriggerRefresh] = useState(false);

  const [
    showViewInfoModal,
    setShowViewInfoModal,
    openViewInfoModal,
    handleCloseViewInfoModal,
  ] = useModal([
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement;
      const connectionRequest = find({ id: target.dataset.connectionRequest })(
        connectionRequests,
      ) as ConnectionRequest;
      setSelectedConnectionRequest(connectionRequest);
    },
    [connectionRequests],
  ]);

  useEffect(() => {
    fetchData();
  }, [triggerRefresh]);

  const fetchData = async () => {
    const receivedRequests = await AWSService.retrieveConnectionRequests("submitted");
    setConnectionRequests(receivedRequests);
  };

  const renderedConnectionRequests = connectionRequests.map((request) => (
    <tr key={request.id}>
      <td>{request.providerEndpoint}</td>
      <td>{new Date(request.creationDate).toLocaleDateString("en-US")}</td>
      <td>{request.email}</td>
      <td>
        <StatusLabel status={request.status} statusType="submitted" />
      </td>
      <td>
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
      </td>
    </tr>
  ));

  return (
    <section id={`admin-consumers`}>
      <h1>Submitted Requests</h1>
      <p>This section displays the connection requests you have submitted to other instances.</p>
      <ButtonToolbar>
        <LinkContainer to="/connections/requests/create" exact={true}>
          <Button variant="outline-primary">Create New Connection</Button>
        </LinkContainer>
      </ButtonToolbar>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Endpoint</th>
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
    </section>
  );
}
