describe("Delete User", () => {
  beforeEach(() => {
    cy.login();
    cy.deleteUsers();
    cy.createUser();
    cy.changeRoute("/users");
  });

  it("deletes the first user in the list", () => {
    cy.get("table > tbody > tr").should("have.length", 2);

    cy.get("table > tbody > tr")
      .first()
      .contains("button", "Delete")
      .click();

    cy.get(".modal-dialog .modal-body p").should(
      "have.text",
      "Are you sure you want to delete user 'cypress-user'?",
    );

    cy.contains("button.btn-danger", "Confirm").click();

    cy.get("table > tbody > tr").should("have.length", 1);
  });
});
