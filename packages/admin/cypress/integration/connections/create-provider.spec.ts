describe("Create Provider", () => {
  before(() => {
    cy.login({ url: "/providers/create" });
    cy.contains("h1", "Data Provider Request Form");
  });

  beforeEach(() => {
    cy.get("input").clear();
  });

  it("creates a new provider connection and shows verification code", () => {
    cy.get("input[name=endpoint]").type(Cypress.env("REGISTER_ENDPOINT"));
    cy.get("input[name=firstName]").type("Cypress Test");
    cy.get("input[name=lastName]").type("Connection");
    cy.get("input[name=organization]").type("Learning Tapestry");
    cy.get("input[name=title]").type("Test Runner");
    cy.get("input[name=email]").type("cypress-user@example.org");
    cy.get("input[name=phoneNumber]").type("+1555555555");
    cy.get("input[name=extension]").type("1234");

    cy.contains("button[type=submit]", "Send").click();

    cy.get(".modal-dialog").should("be.visible");
    cy.get(".modal-dialog .modal-title").should("have.text", "Verification Code");
    cy.get(".modal-dialog .modal-body p").should(
      "contain",
      "You have successfully submitted your request.",
    );
    cy.get(".modal-dialog .modal-body h1")
      .invoke("text")
      .should("have.length", 6);

    cy.contains("button", "Close").click();
  });

  it("receives validation errors", () => {
    cy.get("button[type=submit]")
      .contains("Send")
      .click();

    ["endpoint", "firstName", "lastName", "organization", "title", "email", "phoneNumber"].forEach(
      (field) => {
        cy.contains(".invalid-feedback", `${field} is a required field`);
      },
    );
  });

  it("tries to submit an invalid endpoint", () => {
    cy.get("input[name=endpoint]").type("http://invalid.example.org/dev/register");
    cy.get("input[name=firstName]").type("Cypress Test");
    cy.get("input[name=lastName]").type("Connection");
    cy.get("input[name=organization]").type("Learning Tapestry");
    cy.get("input[name=title]").type("Test Runner");
    cy.get("input[name=email]").type("cypress-user@example.org");
    cy.get("input[name=phoneNumber]").type("+1555555555");
    cy.get("input[name=extension]").type("1234");

    cy.get("button[type=submit]")
      .contains("Send")
      .click();

    cy.contains(".alert-danger", "Network Error");
  });
});
