import capitalize from "lodash/fp/capitalize";
import React, { ReactNode } from "react";
import { Button, Col, Container, Modal, Row } from "react-bootstrap";

import { displayDate } from "../../app-helper";
import { ConnectionRequest } from "../../interfaces/connection-request";

interface ConnectionRequestModalProps {
  connectionRequest: ConnectionRequest;
  show: boolean;
  onClose: () => void;
  type: string;
}

const ConnectionAttribute = (props: { name: string; children: ReactNode }) => (
  <Row className="show-grid">
    <Col sm={3}>
      <p>
        <strong>{props.name}</strong>
      </p>
    </Col>
    <Col>{props.children}</Col>
  </Row>
);

export default function ConnectionRequestModal(props: ConnectionRequestModalProps) {
  const verificationCode = () => {
    if (props.type === "submitted") {
      return (
        <ConnectionAttribute name="Verification Code">
          <p className="text-info">{props.connectionRequest.verificationCode}</p>
        </ConnectionAttribute>
      );
    }
  };

  return (
    <Modal show={props.show} onHide={props.onClose} size="lg">
      <Modal.Header closeButton={true}>
        <Modal.Title>{capitalize(props.type)} Connection Request</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <ConnectionAttribute name="Id">{props.connectionRequest.id}</ConnectionAttribute>
          <ConnectionAttribute name="Status">
            {capitalize(props.connectionRequest.status)}
          </ConnectionAttribute>
          <ConnectionAttribute name="Consumer Endpoint URL">
            <a href={props.connectionRequest.consumerEndpoint}>
              {props.connectionRequest.consumerEndpoint}
            </a>
          </ConnectionAttribute>
          <ConnectionAttribute name="Provider Endpoint URL">
            <a href={props.connectionRequest.providerEndpoint}>
              {props.connectionRequest.providerEndpoint}
            </a>
          </ConnectionAttribute>
          <ConnectionAttribute name="Creation Date">
            {displayDate(props.connectionRequest.creationDate)}
          </ConnectionAttribute>
          <ConnectionAttribute name="Organization">
            {props.connectionRequest.organization}
          </ConnectionAttribute>
          {verificationCode()}
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
