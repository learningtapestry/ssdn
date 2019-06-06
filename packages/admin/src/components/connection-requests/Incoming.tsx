import React, { useCallback, useEffect, useState } from "react";
import { ButtonGroup, Form } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import FormCheckLabel from "react-bootstrap/FormCheckLabel";
import Table from "react-bootstrap/Table";

import { displayDate, nullConnectionRequest } from "../../app-helper";
import { ConnectionRequest, ConnectionRequestStatus } from "../../interfaces/connection-request";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";
import useAlert from "../ui/use-alert";
import useModal from "../ui/use-modal";
import ConnectionRequestModal from "./ConnectionRequestModal";
import { StatusLabel } from "./StatusLabel";

export const acceptTermsMessage =
  "I agree to the terms and conditions that may derive from sharing data with this organization.";

export default function Incoming() {
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [selectedConnectionRequest, setSelectedConnectionRequest] = useState<ConnectionRequest>(
    nullConnectionRequest(),
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [termsAgreement, setTermsAgreement] = useState(false);
  const [matchingCodes, setMatchingCodes] = useState(false);
  const [inputTouched, setInputTouched] = useState(false);

  const [alertContent, setAlertContent, renderAlert, showOnError] = useAlert();

  const selectConnectionRequest = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const connectionRequest = connectionRequests.find(
      (req) => `${req.consumerEndpoint}${req.id}` === target.dataset.connectionRequest,
    );
    setSelectedConnectionRequest(connectionRequest!);
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

  useEffect(() => {
    setMatchingCodes(selectedConnectionRequest.verificationCode === verificationCode);
  }, [verificationCode]);

  const fetchData = async () => {
    const receivedRequests = await AWSService.retrieveConnectionRequests("incoming");
    setConnectionRequests(receivedRequests);
  };

  const handleConfirmAccept = showOnError(async () => {
    setInputTouched(true);
    if (matchingCodes && termsAgreement) {
      await AWSService.acceptConnectionRequest(
        selectedConnectionRequest.consumerEndpoint,
        selectedConnectionRequest.id,
        true,
      );
      setShowConfirmAccept(false);
      setTriggerRefresh(!triggerRefresh);
    }
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

  const handleInputChange = useCallback((event) => {
    const target = event.target;
    target.type === "checkbox"
      ? setTermsAgreement(target.checked)
      : setVerificationCode(target.value);
  }, []);

  // tslint:disable: jsx-wrap-multiline
  const requestButtons = (request: ConnectionRequest) => {
    if (request.status === ConnectionRequestStatus.Created) {
      return (
        <ButtonGroup>
          <Button
            variant="outline-success"
            size="sm"
            data-connection-request={`${request.consumerEndpoint}${request.id}`}
            data-status="accepted"
            onClick={openConfirmAccept}
          >
            Accept
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            data-connection-request={`${request.consumerEndpoint}${request.id}`}
            data-status="rejected"
            onClick={openConfirmReject}
          >
            Reject
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            data-connection-request={`${request.consumerEndpoint}${request.id}`}
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
          data-connection-request={`${request.consumerEndpoint}${request.id}`}
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
      <td>{request.namespace}</td>
      <td>{request.formats.join(", ")}</td>
      <td>{displayDate(request.creationDate)}</td>
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
      <Table striped={true} hover={true} className="mt-3" size="sm">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Organization</th>
            <th>Namespace</th>
            <th>Formats</th>
            <th>Creation Date</th>
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
        type="incoming"
      />
      <ConfirmationModal
        title="Confirm connection request"
        show={showConfirmAccept}
        onConfirm={handleConfirmAccept}
        onClose={handleCloseConfirmAccept}
      >
        <div>
          <p>
            Enter the verification code delivered by the consumer to <strong>accept</strong> the
            connection request.
          </p>
          <Form.Control
            className="w-50"
            type="text"
            name="verificationCode"
            placeholder="Verification Code"
            value={verificationCode}
            onChange={handleInputChange}
            isInvalid={inputTouched && !matchingCodes}
          />
          <Form.Control.Feedback type="invalid">Code does not seem correct</Form.Control.Feedback>
          <br />
          <Form.Check
            required={true}
            type="checkbox"
            id="termsAgreement"
            label={<FormCheckLabel htmlFor="termsAgreement">{acceptTermsMessage}</FormCheckLabel>}
            checked={termsAgreement}
            onChange={handleInputChange}
            isInvalid={inputTouched && !termsAgreement}
            feedback="You must agree before accepting this request."
          />
        </div>
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
