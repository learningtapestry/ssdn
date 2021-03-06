import React from "react";
import { Col, Nav, Row } from "react-bootstrap";
import { Redirect, Route, Switch } from "react-router";
import { LinkContainer } from "react-router-bootstrap";
import CreateUploadCredentials from "./CreateUploadCredentials";
import Notifications from "./Notifications";
import ProgrammaticAccess from "./ProgrammaticAccess";

export default function FileTransfersHome() {
  return (
    <section>
      <Row className="left-nav">
        <Col md="3">
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <LinkContainer to="/file-transfers/upload-credentials" exact={true}>
                <Nav.Link>Generate Upload Credentials</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/file-transfers/notifications" exact={true}>
                <Nav.Link>Notifications</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/file-transfers/programmatic-access" exact={true}>
                <Nav.Link>Programmatic Access</Nav.Link>
              </LinkContainer>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md="9">
          <Switch>
            <Redirect from="/file-transfers" exact={true} to="/file-transfers/upload-credentials" />
            <Route
              exact={true}
              path="/file-transfers/upload-credentials"
              component={CreateUploadCredentials}
            />
            <Route exact={true} path="/file-transfers/notifications" component={Notifications} />
            <Route
              exact={true}
              path="/file-transfers/programmatic-access"
              component={ProgrammaticAccess}
            />
          </Switch>
        </Col>
      </Row>
    </section>
  );
}
