describe("List Settings", () => {
  before(() => {
    cy.login({ url: "/settings" });
  });

  it("lists all settings in a stack", () => {
    cy.contains("h1", "Settings");
    cy.get("table").within(() => {
      cy.contains("td", "NucleusId");
      cy.contains("td", Cypress.env("REACT_APP_NUCLEUS_ID"));
    });
  });
});
