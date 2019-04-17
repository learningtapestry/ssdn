import "jest-dom/extend-expect";
import React from "react";
import { fireEvent, render, wait, waitForElement } from "react-testing-library";
import { mocked } from "ts-jest/utils";
import AWSService from "../../services/aws-service";
import CreateUser from "./CreateUser";

describe("<CreateUser/>", () => {
  beforeAll(() => {
    AWSService.createUser = jest.fn();
  });

  it("renders title and user form", () => {
    const { getByText, getByLabelText } = render(<CreateUser />);

    getByText("New Administrator User");
    getByLabelText("Username");
    getByLabelText("Password");
    getByLabelText("Email");
    getByLabelText("Name");
    getByLabelText("Phone Number");
  });

  it("validates the entered values and displays error messages", async () => {
    const { getByText } = render(<CreateUser />);

    fireEvent.click(getByText("Create"));
    await wait(() => {
      getByText("username is a required field");
      getByText("password is a required field");
      getByText("email is a required field");
      getByText("name is a required field");
      getByText("phoneNumber is a required field");
    });
  });

  it("submits a valid form and shows success message", async () => {
    const { getByText, getByLabelText } = render(<CreateUser />);

    fireEvent.change(getByLabelText("Username"), { target: { value: "test-user" } });
    fireEvent.change(getByLabelText("Password"), { target: { value: "testpwd" } });
    fireEvent.change(getByLabelText("Email"), { target: { value: "test-user@example.org" } });
    fireEvent.change(getByLabelText("Name"), { target: { value: "Test User" } });
    fireEvent.change(getByLabelText("Phone Number"), { target: { value: "+1555555555" } });
    fireEvent.click(getByText("Create"));

    await waitForElement(() => getByText("User created successfully!"));
    expect(mocked(AWSService.createUser).mock.calls.length).toEqual(1);
  });
});
