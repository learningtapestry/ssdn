describe("Create User", () => {
  before(() => {
    cy.login({ url: "/users/create" });
    cy.contains("h1", "New Administrator User");
  });

  beforeEach(() => {
    cy.get("input").clear();
  });

  it("creates a new administrator user", () => {
    cy.deleteUsers();

    cy.get("input[name=username]").type("cypress-user");
    cy.get("input[name=password]").type("@Mb94TQT5nqE");
    cy.get("input[name=email]").type("cypress-user@example.org");
    cy.get("input[name=name]").type("Cypress User");
    cy.get("input[name=phoneNumber]").type("+1555555555");

    cy.get("button[type=submit]")
      .contains("Create")
      .click();

    cy.contains(".alert-success", "User created successfully!");
  });

  it("receives validation errors", () => {
    cy.get("button[type=submit]")
      .contains("Create")
      .click();

    ["username", "password", "email", "name", "phoneNumber"].forEach((field) => {
      cy.contains(".invalid-feedback", `${field} is a required field`);
    });
  });

  it("tries to repeat the username", () => {
    cy.get("input[name=username]").type(Cypress.env("DEFAULT_USERNAME"));
    cy.get("input[name=password]").type(Cypress.env("DEFAULT_PASSWORD"));
    cy.get("input[name=email]").type("test-user@example.org");
    cy.get("input[name=name]").type("Test User");
    cy.get("input[name=phoneNumber]").type("+1555555555");

    cy.get("button[type=submit]")
      .contains("Create")
      .click();

    cy.contains(".alert-danger", "User account already exists");
  });
});
