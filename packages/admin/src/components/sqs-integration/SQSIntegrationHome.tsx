import React from "react";
import { Col, Nav, Row } from "react-bootstrap";
import { Redirect, Route, Switch } from "react-router";
import { LinkContainer } from "react-router-bootstrap";
import Notifications from "./Notifications";
import Queues from "./Queues";

export default function SQSIntegrationHome() {
  return (
    <section>
      <Row className="left-nav">
        <Col md="3">
          <Nav variant="pills" className="flex-column">
            <Nav.Item>
              <LinkContainer to="/sqs-integration/queues" exact={true}>
                <Nav.Link>Queues</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/sqs-integration/notifications" exact={true}>
                <Nav.Link>Notifications</Nav.Link>
              </LinkContainer>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md="9">
          <Switch>
            <Redirect from="/sqs-integration" exact={true} to="/sqs-integration/queues" />
            <Route exact={true} path="/sqs-integration/queues" component={Queues} />
            <Route exact={true} path="/sqs-integration/notifications" component={Notifications} />
          </Switch>
        </Col>
      </Row>
    </section>
  );
}
