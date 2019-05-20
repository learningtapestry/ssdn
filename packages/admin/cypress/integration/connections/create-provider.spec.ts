describe("Create Provider", () => {
  before(() => {
    cy.login({ url: "/connections/requests/create" });
    cy.contains("h1", "Data Provider Request Form");
  });

  beforeEach(() => {
    cy.get("input").clear();
  });

  it("creates a new provider connection and shows verification code", () => {
    cy.get("input[name=providerEndpoint]").type(Cypress.env("REGISTER_ENDPOINT"));
    cy.get("input[name=organization]").type("Learning Tapestry");

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

    cy.contains("button", "Confirm").click();
  });

  it("receives validation errors", () => {
    cy.get("button[type=submit]")
      .contains("Send")
      .click();

    ["providerEndpoint", "organization"].forEach((field) => {
      cy.contains(".invalid-feedback", `${field} is a required field`);
    });
  });

  it("tries to submit an invalid endpoint", () => {
    cy.get("input[name=providerEndpoint]").type("http://invalid.example.org/dev/register");
    cy.get("input[name=organization]").type("Learning Tapestry");

    cy.get("button[type=submit]")
      .contains("Send")
      .click();

    cy.contains(".alert-danger", "An unexpected error occurred");
  });
});
