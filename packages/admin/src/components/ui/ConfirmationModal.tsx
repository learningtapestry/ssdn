import { ReactElement } from "react";
import * as React from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

interface ConfirmationModalProps {
  children?: ReactElement;
  title: string;
  show: boolean;
  closeLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose?: () => void;
}

function ConfirmationModal(props: ConfirmationModalProps) {
  const closeButton = () => {
    if (props.onClose) {
      return (
        <Button variant="secondary" onClick={props.onClose}>
          {props.closeLabel || "Cancel"}
        </Button>
      );
    }
  };

  const confirmButton = () => {
    if (props.onConfirm) {
      return (
        <Button variant="danger" onClick={props.onConfirm}>
          {props.confirmLabel || "Confirm"}
        </Button>
      );
    }
  };

  return (
    <Modal show={props.show} onHide={props.onClose}>
      <Modal.Header closeButton={true}>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{props.children}</Modal.Body>
      <Modal.Footer>
        {closeButton()}
        {confirmButton()}
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmationModal;
