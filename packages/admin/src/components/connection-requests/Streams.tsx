import find from "lodash/fp/find";
import React, { Fragment, useEffect, useState } from "react";
import { ButtonGroup } from "react-bootstrap";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";

import { EndpointStream, StreamStatus } from "../../interfaces/stream";
import AWSService from "../../services/aws-service";
import ConfirmationModal from "../ui/ConfirmationModal";
import useAlert from "../ui/use-alert";
import useModal from "../ui/use-modal";
import { StatusLabel } from "./StatusLabel";

function nullStream(): EndpointStream {
  return {
    endpoint: "learningtapestry.com",
    format: "xAPI",
    namespace: "learningtapestry.com",
    status: StreamStatus.Active,
  };
}

export interface StreamsProps {
  streamType: "input" | "output";
}

export default function Streams(props: StreamsProps) {
  const [streams, setStreams] = useState<EndpointStream[]>([]);
  const [selectedStream, setSelectedStream] = useState<EndpointStream>(nullStream());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [alertContent, setAlertContent, renderAlert, showOnError] = useAlert();

  const selectStream = (event: React.MouseEvent<HTMLElement>) => {
    const data = (event.target as HTMLElement).dataset;
    const ex = find({ endpoint: data.endpoint, namespace: data.namespace, format: data.format })(
      streams,
    ) as EndpointStream;
    setSelectedStream(ex);
  };

  const [
    showResumeStream,
    setShowResumeStream,
    openResumeStream,
    handleCloseResumeStream,
  ] = useModal([selectStream, [streams]]);

  const [showPauseStream, setShowPauseStream, openPauseStream, handleClosePauseStream] = useModal([
    selectStream,
    [streams],
  ]);

  const [triggerRefresh, setTriggerRefresh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const ex = await AWSService.retrieveStreams(props.streamType);
      setStreams(ex);
    };

    fetchData();
  }, [triggerRefresh, props.streamType]);

  const handleResumeStream = showOnError(async () => {
    await AWSService.updateStream(
      selectedStream.endpoint,
      selectedStream.format,
      selectedStream.namespace,
      "active",
      props.streamType,
    );
    setShowResumeStream(false);
    setTriggerRefresh(!triggerRefresh);
  });

  const handlePauseStream = showOnError(async () => {
    await AWSService.updateStream(
      selectedStream.endpoint,
      selectedStream.format,
      selectedStream.namespace,
      "paused",
      props.streamType,
    );
    setShowPauseStream(false);
    setTriggerRefresh(!triggerRefresh);
  });

  // tslint:disable: jsx-wrap-multiline
  const requestButtons = (ex: EndpointStream) => {
    if (ex.status === StreamStatus.Paused) {
      return (
        <ButtonGroup>
          <Button
            variant="outline-success"
            size="sm"
            data-endpoint={ex.endpoint}
            data-format={ex.format}
            data-namespace={ex.namespace}
            onClick={openResumeStream}
          >
            Resume
          </Button>
        </ButtonGroup>
      );
    } else if (ex.status === StreamStatus.Active) {
      return (
        <ButtonGroup>
          <Button
            variant="outline-success"
            size="sm"
            data-endpoint={ex.endpoint}
            data-format={ex.format}
            data-namespace={ex.namespace}
            onClick={openPauseStream}
          >
            Pause
          </Button>
        </ButtonGroup>
      );
    }
  };

  const renderedStreams = streams.map((ex) => (
    <tr key={`${ex.endpoint}.${ex.namespace}.${ex.format}`}>
      <td>{ex.endpoint}</td>
      <td>{ex.namespace}</td>
      <td>{ex.format}</td>
      <td>
        <StatusLabel status={ex.status} statusType="stream" />
      </td>
      <td>{requestButtons(ex)}</td>
    </tr>
  ));

  const sectionHeading = () =>
    props.streamType === "input" ? (
      <Fragment>
        <h1>Provider Streams</h1>
        <p>
          This section displays streams where data flows from other SSDN instances into this one.
        </p>
      </Fragment>
    ) : (
      <Fragment>
        <h1>Consumer Streams</h1>
        <p>
          This section displays streams where data flows from this SSDN instance into external
          instances.
        </p>
      </Fragment>
    );

  return (
    <section id={`admin-consumers`}>
      {sectionHeading()}
      {renderAlert()}
      <Table striped={true} hover={true} className="mt-3">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Namespace</th>
            <th>Format</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>{renderedStreams}</tbody>
      </Table>
      <ConfirmationModal
        title="Update stream"
        show={showResumeStream}
        onConfirm={handleResumeStream}
        onClose={handleCloseResumeStream}
      >
        <p>
          Do you confirm the connection request should be <strong>resumed</strong>?
        </p>
      </ConfirmationModal>
      <ConfirmationModal
        title="Update stream"
        show={showPauseStream}
        onConfirm={handlePauseStream}
        onClose={handleClosePauseStream}
      >
        <p>
          Do you confirm the connection request should be <strong>paused</strong>?
        </p>
      </ConfirmationModal>
    </section>
  );
}
