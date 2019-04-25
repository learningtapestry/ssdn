describe("List Logs", () => {
  before(() => {
    cy.login({ url: "/logs" });
  });

  it("greets with title and log groups dropdown", () => {
    cy.contains("h1", "Logs");
    cy.get("button.dropdown-toggle").click();
    cy.contains("a.dropdown-item", "/aws/lambda/Nucleus");
  });

  it("lists some log events in the group", () => {
    cy.contains("table > thead > tr > th", "Date");
    cy.contains("table > thead > tr > th", "Message");

    cy.get("table > tbody > tr")
      .its("length")
      .should("be.gt", 1);
  });
});
