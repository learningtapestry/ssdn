import * as React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface ConfirmationModalProps {
  title: string;
  show: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmationModal(props: ConfirmationModalProps) {
  return (
    <Modal show={props.show} onHide={props.onClose}>
      <Modal.Header closeButton={true}>
        <Modal.Title>Confirmation</Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.title}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={props.onClose}>
          Close
        </Button>
        <Button variant="danger" onClick={props.onConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmationModal;
