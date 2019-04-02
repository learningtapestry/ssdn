import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";
import Row from "react-bootstrap/Row";
import "./App.css";
import Header from "./components/Header";

class App extends Component {
  public render() {
    return (
      <div className="App">
        <Header />
        <Container fluid={true} className="mt-3">
          <Row>
            <Col>
              <Jumbotron>
                <h1>Welcome to Nucleus!</h1>
                <p>This is the main page of the administration panel.</p>
                <p>
                  <Button href="https://github.com/learningtapestry/nucleus" variant="primary">
                    Learn more
                  </Button>
                </p>
              </Jumbotron>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default App;
