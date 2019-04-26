describe("List Users", () => {
  before(() => {
    cy.login();
    cy.deleteUsers();
    cy.createUser();
    cy.changeRoute("/users");
  });

  it("greets with title and create button", () => {
    cy.contains("h1", "Users");
    cy.contains("a.btn", "Create New User").should("have.attr", "href", "/users/create");
  });

  it("lists all available users", () => {
    cy.get("table > tbody > tr").should("have.length", 2);

    cy.get("table > tbody > tr")
      .first()
      .find("td")
      .should(($td) => {
        expect($td.get(0).textContent).to.equal("cypress-user");
        expect($td.get(2).textContent).to.equal("cypress-user@example.org");
        expect($td.get(3).textContent).to.equal("Cypress User");
        expect($td.get(5).textContent).to.equal("FORCE_CHANGE_PASSWORD");
      });

    cy.get("table > tbody > tr")
      .last()
      .find("td")
      .should(($td) => {
        expect($td.get(0).textContent).to.equal(Cypress.env("DEFAULT_USERNAME"));
        expect($td.get(2).textContent).to.equal("test-user@example.org");
        expect($td.get(3).textContent).to.equal("Test User");
        expect($td.get(5).textContent).to.equal("CONFIRMED");
      });
  });
});
