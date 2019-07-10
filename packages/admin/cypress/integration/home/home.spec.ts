describe("Home", () => {
  before(() => {
    cy.login();
  });

  it("greets with welcome message", () => {
    cy.contains("h1", "Welcome to SSDN!");
    cy.contains("p", "This is the main page of the administration panel");
  });

  it("links to official repository", () => {
    cy.contains("a.btn", "Learn more").should(
      "have.attr",
      "href",
      "https://github.com/learningtapestry/ssdn",
    );
  });
});
