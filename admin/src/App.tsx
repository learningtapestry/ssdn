import Auth from "@aws-amplify/auth";
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
import awsmobile from "./aws-exports";
import Header from "./components/Header";

Auth.configure(awsmobile);

class App extends Component {
  public render() {
    return (
      <Router>
        <div className="App">
          <Header />
          <Container fluid={true} className="mt-3">
            <Row>
              <Col>
                <Jumbotron>
                  <h1>Welcome to Nucleus!</h1>
                  <Route exact={true} path="/" component={Home} />
                  <Route exact={true} path="/connections" component={Connections} />
                  <Route exact={true} path="/logs" component={Logs} />
                  <Route exact={true} path="/users" component={Users} />
                  <Route exact={true} path="/settings" component={Settings} />
                </Jumbotron>
              </Col>
            </Row>
          </Container>
        </div>
      </Router>
    );
  }
}

function Home() {
  return (
    <div>
      <p>
        This is the <strong>main page</strong> of the administration panel.
      </p>
      <p>
        <Button href="https://github.com/learningtapestry/nucleus" variant="primary">
          Learn more
        </Button>
      </p>
    </div>
  );
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

function Settings() {
  return (
    <p>
      This is the <strong>Settings</strong> page.
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
