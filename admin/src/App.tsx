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
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./App.css";
import Consumers from "./components/Consumers";
import CreateConnectionRequest from "./components/CreateConnectionRequest";
import CreateUser from "./components/CreateUser";
import Header from "./components/Header";
import Home from "./components/Home";
import Providers from "./components/Providers";
import Settings from "./components/Settings";
import Users from "./components/Users";

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
                <Route exact={true} path="/providers" component={Providers} />
                <Route exact={true} path="/providers/create" component={CreateConnectionRequest} />
                <Route exact={true} path="/consumers" component={Consumers} />
                <Route exact={true} path="/logs" component={Logs} />
                <Route exact={true} path="/users" component={Users} />
                <Route exact={true} path="/users/create" component={CreateUser} />
                <Route exact={true} path="/settings" component={Settings} />
              </Col>
            </Row>
          </Container>
        </div>
      </Router>
    );
  }
}

function Logs() {
  return (
    <p>
      This is the <strong>Logs</strong> page.
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
