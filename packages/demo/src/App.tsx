import { withAuthenticator } from "aws-amplify-react"; // or 'aws-amplify-react-native';
import React from "react";
import { BrowserRouter, Route } from "react-router-dom";
import "./App.css";
import Consumer from "./components/Consumer";
import Producer from "./components/Producer";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="App">
        <Route exact={true} path="/" component={Producer} />
        <Route exact={true} path="/consumer" component={Consumer} />
      </div>
    </BrowserRouter>
  );
};

export default withAuthenticator(App, true);
