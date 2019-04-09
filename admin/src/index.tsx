import Auth from "@aws-amplify/auth";
import "bootstrap/dist/css/bootstrap.css";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import awsmobile from "./aws-exports";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

Auth.configure(awsmobile);

ReactDOM.render(<App />, document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
