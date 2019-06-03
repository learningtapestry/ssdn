import React, { useEffect, useState } from "react";
import { ButtonGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Table from "react-bootstrap/Table";
import { LinkContainer } from "react-router-bootstrap";

import { DbFormat } from "../../interfaces/format";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";
import useModal from "../ui/use-modal";

function Formats() {
  const [formats, setFormats] = useState<DbFormat[]>([]);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<DbFormat>({
    creationDate: "",
    name: "",
    updateDate: "",
  });

  const selectFormat = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const format = formats.find((fmt) => fmt.name === target.dataset.format);
    setSelectedFormat(format!);
  };

  const [
    showConfirmFormatDelete,
    setShowConfirmFormatDelete,
    openConfirmFormatDelete,
    handleCloseConfirmFormatDelete,
  ] = useModal([selectFormat, [formats]]);

  useEffect(() => {
    fetchData();
  }, [triggerRefresh]);

  const fetchData = async () => {
    setFormats(await AWSService.retrieveFormats());
  };

  const confirmDeleteFormat = async () => {
    await AWSService.deleteFormat(selectedFormat.name);
    setTriggerRefresh(!triggerRefresh);
    setShowConfirmFormatDelete(false);
  };

  const renderedFormats = formats.map((format) => (
    <tr key={format.name}>
      <td>{format.name}</td>
      <td>{format.description}</td>
      <td>
        <ButtonGroup>
          <LinkContainer to={`/formats/${format.name}/edit`} exact={true}>
            <Button variant="outline-primary">Edit</Button>
          </LinkContainer>
          <Button
            variant="outline-danger"
            size="sm"
            data-format={format.name}
            onClick={openConfirmFormatDelete}
          >
            Delete
          </Button>
        </ButtonGroup>
      </td>
    </tr>
  ));

  return (
    <section id={`admin-formats`}>
      <h1>Formats</h1>
      <p>This section displays the data formats that are available for this Nucleus instance.</p>
      <ButtonToolbar>
        <LinkContainer to="/formats/create" exact={true}>
          <Button variant="outline-primary">Create New Format</Button>
        </LinkContainer>
      </ButtonToolbar>
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderedFormats}</tbody>
      </Table>
      <ConfirmationModal
        title="Confirm format deletion"
        show={showConfirmFormatDelete}
        onConfirm={confirmDeleteFormat}
        onClose={handleCloseConfirmFormatDelete}
      >
        <p>Please confirm the format should be deleted.</p>
      </ConfirmationModal>
    </section>
  );
}

export default Formats;
