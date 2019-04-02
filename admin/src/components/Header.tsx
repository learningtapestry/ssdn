import React from "react";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import logo from "../logo.svg";
import "./Header.css";

const Header = () => (
  <header className="App-header">
    <Navbar bg="primary" variant="dark">
      <Navbar.Brand href="#home">
        <img
          alt="Nucleus logo"
          src={logo}
          width="30"
          height="30"
          className="Header-logo d-inline-block align-top"
        />
        {"Nucleus"}
      </Navbar.Brand>
      <Nav className="mr-auto">
        <Nav.Link href="#home">Home</Nav.Link>
        <Nav.Link href="#connections">Connections</Nav.Link>
        <Nav.Link href="#logs">Logs</Nav.Link>
        <Nav.Link href="#users">Users</Nav.Link>
        <Nav.Link href="#settings">Settings</Nav.Link>
      </Nav>
    </Navbar>
  </header>
);

export default Header;
