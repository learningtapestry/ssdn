import * as factories from "../../../test-support/factories";

describe("List Providers", () => {
  before(() => {
    cy.login();
    cy.deleteConnectionRequests("provider");
    cy.createConnectionRequest({ type: "provider" });
    cy.createConnectionRequest(factories.connectionRequests()[1]);
    cy.changeRoute("/providers");
  });

  it("greets with title and create button", () => {
    cy.contains("h1", "Providers");
    cy.contains("a.btn", "Create New Connection").should("have.attr", "href", "/providers/create");
  });

  it("lists all available providers", () => {
    cy.get("table > tbody > tr").should("have.length", 2);

    cy.get("table > tbody > tr")
      .first()
      .find("td")
      .should(($td) => {
        expect($td.get(0).textContent).to.equal("Adam");
        expect($td.get(1).textContent).to.equal("Mitchell");
        expect($td.get(2).textContent).to.equal("Stoltenberg-Harvey");
        expect($td.get(3).textContent).to.equal("2/13/2019");
        expect($td.get(4).textContent).to.equal("test-user-1@example.org");
        expect($td.get(5).textContent).to.equal("Accepted");
      });

    cy.get("table > tbody > tr")
      .last()
      .find("td")
      .should(($td) => {
        expect($td.get(0).textContent).to.equal("Mickey");
        expect($td.get(1).textContent).to.equal("Smith");
        expect($td.get(2).textContent).to.equal("Heaney, Hackett and Jacobson");
        expect($td.get(3).textContent).to.equal("4/14/2019");
        expect($td.get(4).textContent).to.equal("test-user-2@example.org");
        expect($td.get(5).textContent).to.equal("Rejected");
      });
  });

  it("displays info for the selected connection", () => {
    cy.contains("button", "View info").click();

    cy.get(".modal-dialog").should("be.visible");
    cy.get(".modal-dialog").within(() => {
      cy.contains(".col", "Accepted");
      cy.contains(".col", "2/13/2019, 1:21:36 PM");
      cy.contains(".col", "Adam");
      cy.contains(".col", "Mitchell");
      cy.contains(".col", "Stoltenberg-Harvey");
      cy.contains(".col", "Developer");
      cy.contains(".col", "test-user-1@example.org");
      cy.contains(".col", "+1555555555");
      cy.contains(".col", "825150");
    });
  });
});
