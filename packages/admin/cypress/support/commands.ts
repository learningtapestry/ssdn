import ConnectionRequest from "../../src/interfaces/connection-request";
import UserForm from "../../src/interfaces/user-form";
import AWSService from "../../src/services/aws-service";
import * as factories from "../../test-support/factories";

Cypress.Commands.add("createUser", async (userParams = {}) => {
  await AWSService.createUser({ ...factories.userForm(userParams) });
});

Cypress.Commands.add("deleteUsers", async () => {
  const allUsers = await AWSService.retrieveUsers();
  await allUsers.forEach(async (user: UserForm) => {
    if (user.username !== Cypress.env("DEFAULT_USERNAME")) {
      await AWSService.deleteUser(user.username);
    }
  });
});

Cypress.Commands.add("createConnectionRequest", async (connectionParams = {}) => {
  await AWSService.saveConnectionRequest({
    ...factories.connectionRequests()[0],
    ...connectionParams,
  });
});

Cypress.Commands.add("deleteConnectionRequests", async (type: string) => {
  const allConnections = await AWSService.retrieveConnectionRequests("submitted");
  await allConnections.forEach(async (connection: ConnectionRequest) => {
    // How should we delete them?
  });
});

Cypress.Commands.add(
  "login",
  ({
    url = "/",
    username = Cypress.env("DEFAULT_USERNAME"),
    password = Cypress.env("DEFAULT_PASSWORD"),
  } = {}) => {
    cy.visit(url);

    cy.get("input[name=username]").type(username);
    cy.get("input[name=password]").type(password);
    cy.get("button[type=submit]").click();

    cy.wait(2000); // Wait for Amplify to setup the session properly and avoid auth errors

    cy.get("#root").then(($root) => {
      if ($root.text().includes("Change Password")) {
        cy.get("input[name=password]").type(password);
        cy.get("button").click();
      }
    });
  },
);

Cypress.Commands.add("changeRoute", (route = "/") => {
  return cy
    .window()
    .its("sharedHistory" as any)
    .invoke("push", route);
});
