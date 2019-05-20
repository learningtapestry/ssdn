import React from "react";
import { Col, Nav, Row } from "react-bootstrap";
import { Redirect, Route, Switch } from "react-router";
import { LinkContainer } from "react-router-bootstrap";

import CreateConnectionRequest from "./CreateConnectionRequest";
import Incoming from "./Incoming";
import Streams from "./Streams";
import Submitted from "./Submitted";

const StreamInputs = () => <Streams streamType="input" />;
const StreamOutputs = () => <Streams streamType="output" />;

const NavHeading: React.FC = ({ children }) => (
  <span className="left-nav-heading d-none d-md-block">{children}</span>
);

export default function ConnectionsHome(props: {}) {
  return (
    <section>
      <Row className="left-nav">
        <Col md="3">
          <Nav variant="pills" defaultActiveKey="/home" className="flex-column">
            <Nav.Item>
              <NavHeading>Connection Requests</NavHeading>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/connections/requests/incoming" exact={true}>
                <Nav.Link>Incoming</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/connections/requests/submitted" exact={true}>
                <Nav.Link>Submitted</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/connections/requests/create" exact={true}>
                <Nav.Link>Create new connection</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <NavHeading>Streams</NavHeading>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/connections/streams/outputs" exact={true}>
                <Nav.Link>Consumers</Nav.Link>
              </LinkContainer>
            </Nav.Item>
            <Nav.Item>
              <LinkContainer to="/connections/streams/inputs" exact={true}>
                <Nav.Link>Providers</Nav.Link>
              </LinkContainer>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md="9">
          <Switch>
            <Redirect from="/connections" exact={true} to="/connections/requests/incoming" />
            <Route exact={true} path="/connections/streams/inputs" component={StreamInputs} />
            <Route exact={true} path="/connections/streams/outputs" component={StreamOutputs} />
            <Route exact={true} path="/connections/requests/incoming" component={Incoming} />
            <Route exact={true} path="/connections/requests/submitted" component={Submitted} />
            <Route
              exact={true}
              path="/connections/requests/create"
              component={CreateConnectionRequest}
            />
          </Switch>
        </Col>
      </Row>
    </section>
  );
}
