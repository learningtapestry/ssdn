describe("List Settings", () => {
  before(() => {
    cy.login({ url: "/settings" });
  });

  it("greets with title and available stacks", () => {
    cy.contains("h1", "Settings");
    cy.contains("a.nav-item", "Nucleus");
  });

  it("lists all settings in a stack", () => {
    cy.get("#stacks-tabs-tab-Nucleus").click();

    cy.get("table").within(() => {
      cy.contains("td", "EventProcessorStreamName");
      cy.contains("td", "Name of the Event Processor Kinesis Data Stream");
      cy.contains("td", "StatementsApi");
      cy.contains("td", "API Gateway endpoint URL for collecting xAPI statements");
      cy.contains("td", "Nucleus-Production-EventProcessor").should("be.visible");
    });
  });
});
