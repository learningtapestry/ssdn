import React from "react";
import { Button, Card, Col, Jumbotron, Row, Table } from "react-bootstrap";

function Home() {
  return (
    <Row>
      <Col>
        <Jumbotron>
          <h1>Welcome to Secure Student Data Network!</h1>
          <p>
            This is the <strong>main page</strong> of the administration panel.
          </p>
          <p>
            <Button href="https://github.com/awslabs/secure-student-data-network" variant="primary">
              Learn more
            </Button>
          </p>
        </Jumbotron>
      </Col>
      <Col>
        <Card>
          <Card.Header>Instance Configuration</Card.Header>
          <Card.Body>
            <Table bordered={false}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>SSDN ID</td>
                  <td>{process.env.REACT_APP_SSDN_ID}</td>
                </tr>
                <tr>
                  <td>Endpoint</td>
                  <td>
                    <a href={process.env.REACT_APP_ENDPOINT}>{process.env.REACT_APP_ENDPOINT}</a>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

export default Home;
