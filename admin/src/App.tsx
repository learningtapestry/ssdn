import {
  ConfirmSignIn,
  ForgotPassword,
  Greetings,
  Loading,
  RequireNewPassword,
  SignIn,
  TOTPSetup,
  VerifyContact,
  withAuthenticator,
} from "aws-amplify-react";
import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";
import Row from "react-bootstrap/Row";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import Home from "./components/Home";
import Settings from "./components/Settings";

class App extends Component {
  public render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Container fluid={true} className="mt-3">
            <Row>
              <Col>
                <Route exact={true} path="/" component={Home} />
                <Route exact={true} path="/connections" component={Connections} />
                <Route exact={true} path="/logs" component={Logs} />
                <Route exact={true} path="/users" component={Users} />
                <Route exact={true} path="/settings" component={Settings} />
              </Col>
            </Row>
          </Container>
        </div>
      </Router>
    );
  }
}

function Connections() {
  return (
    <p>
      This is the <strong>Connections</strong> page.
    </p>
  );
}

function Logs() {
  return (
    <p>
      This is the <strong>Logs</strong> page.
    </p>
  );
}

function Users() {
  return (
    <p>
      This is the <strong>Users</strong> page.
    </p>
  );
}

export default withAuthenticator(App, true, [
  <Greetings key="greetings" />,
  <SignIn key="signIn" />,
  <ConfirmSignIn key="confirmSignIn" />,
  <VerifyContact key="verifyContact" />,
  <ForgotPassword key="ForgotPassword" />,
  <TOTPSetup key="TOTPSetup" />,
  <RequireNewPassword key="RequireNewPassword" />,
  <Loading key="loading" />,
]);
