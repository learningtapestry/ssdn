import React from "react";
import { Button, Jumbotron } from "react-bootstrap";

function Home() {
  return (
    <Jumbotron>
      <h1>Welcome to Nucleus!</h1>
      <p>
        This is the <strong>main page</strong> of the administration panel.
      </p>
      <p>
        <Button href="https://github.com/learningtapestry/nucleus" variant="primary">
          Learn more
        </Button>
      </p>
    </Jumbotron>
  );
}

export default Home;
