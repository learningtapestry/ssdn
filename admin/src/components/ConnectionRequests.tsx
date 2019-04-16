import { capitalize, find, get } from "lodash/fp";
import React, { useCallback, useEffect, useState } from "react";
import { Badge, ButtonGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Table from "react-bootstrap/Table";
import { LinkContainer } from "react-router-bootstrap";
import { nullConnectionRequest } from "../app-helper";
import ConnectionRequest from "../interfaces/connection-request";
import AWSService from "../services/aws-service";
import ConnectionRequestModal from "./ConnectionRequestModal";

interface ConnectionRequestsProps {
  type: string;
  title: string;
  description: string;
}

export default function ConnectionRequests(props: ConnectionRequestsProps) {
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selectedConnectionRequest, setSelectedConnectionRequest] = useState<ConnectionRequest>(
    nullConnectionRequest(),
  );
  const [showConnectionRequestModal, setShowConnectionRequestModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const receivedRequests = await AWSService.retrieveConnectionRequests({ type: props.type });
    setConnectionRequests(receivedRequests);
  };

  const handleStatusChange = useCallback(
    async (event: React.MouseEvent<HTMLElement>) => {
      await AWSService.saveConnectionRequest({
        ...findByDataId(event),
        status: (event.target as HTMLElement).dataset.status!,
      });
      await fetchData();
    },
    [connectionRequests],
  );

  const handleOpenDeleteModal = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setShowConnectionRequestModal(true);
      const connectionRequest = findByDataId(event);
      setSelectedConnectionRequest(connectionRequest);
    },
    [connectionRequests],
  );

  const handleCloseConnectionRequestModal = useCallback(() => {
    setShowConnectionRequestModal(false);
  }, []);

  const findByDataId = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;

    return find({ id: target.dataset.connectionRequest })(connectionRequests) as ConnectionRequest;
  };

  const statusVariant = (status: string) =>
    get(status)({ accepted: "success", rejected: "danger", pending: "info" });

  const acceptButton = (requestId: string) => {
    if (props.type === "consumer") {
      return (
        <Button
          variant="outline-success"
          size="sm"
          data-connection-request={requestId}
          data-status="accepted"
          onClick={handleStatusChange}
        >
          Accept
        </Button>
      );
    }
  };

  const rejectButton = (requestId: string) => {
    if (props.type === "consumer") {
      return (
        <Button
          variant="outline-danger"
          size="sm"
          data-connection-request={requestId}
          data-status="rejected"
          onClick={handleStatusChange}
        >
          Reject
        </Button>
      );
    }
  };

  const createConnectionButton = () => {
    if (props.type === "provider") {
      return (
        <ButtonToolbar>
          <LinkContainer to="/providers/create" exact={true}>
            <Button variant="outline-primary">Create New Connection</Button>
          </LinkContainer>
        </ButtonToolbar>
      );
    }
  };

  const renderConnectionRequests = () =>
    connectionRequests.map((request) => (
      <tr key={request.id}>
        <td>{request.firstName}</td>
        <td>{request.lastName}</td>
        <td>{request.organization}</td>
        <td>{new Date(request.creationDate).toLocaleDateString("en-US")}</td>
        <td>{request.email}</td>
        <td>
          <Badge pill={true} variant={statusVariant(request.status)}>
            {capitalize(request.status)}
          </Badge>
        </td>
        <td>
          <ButtonGroup>
            {acceptButton(request.id)}
            {rejectButton(request.id)}
            <Button
              variant="outline-primary"
              size="sm"
              data-connection-request={request.id}
              onClick={handleOpenDeleteModal}
            >
              View info
            </Button>
          </ButtonGroup>
        </td>
      </tr>
    ));

  return (
    <section id={`admin-${props.title.toLowerCase()}`}>
      <h1>{props.title}</h1>
      <p>{props.description}</p>
      {createConnectionButton()}
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Organization</th>
            <th>Creation Date</th>
            <th>Email</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderConnectionRequests()}</tbody>
      </Table>
      <ConnectionRequestModal
        connectionRequest={selectedConnectionRequest}
        show={showConnectionRequestModal}
        onClose={handleCloseConnectionRequestModal}
      />
    </section>
  );
}
