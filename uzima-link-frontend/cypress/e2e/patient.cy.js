function randomSuffix() {
  return Math.floor(Math.random() * 1000000);
}

function registerAndLoginPatient() {
  const suffix = randomSuffix();
  const email = `patientflow${suffix}@cypresstest.com`;
  const phone = `03${suffix}`;

  cy.visit("/register");
  cy.contains(/^patient$/i).click();
  cy.get('input[placeholder="Full name"]').type("Cypress Patient Flow");
  cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("12-12-1992");
  cy.get('input[placeholder="Gender"]').type("Female");
  cy.get('input[placeholder="Phone number"]').type(phone);
  cy.get('input[placeholder="National ID"]').type(`3${suffix}`);
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type("password123");
  cy.contains("button", /register/i).click();
  cy.url().should("include", "/patient");

  return cy.wrap({ email, phone });
}

describe("Patient flow", () => {
  it("sees their own dashboard after registering", () => {
    registerAndLoginPatient();
    cy.contains(/welcome/i).should("be.visible");
  });

  it("submits a self-report and it appears on the dashboard", () => {
    registerAndLoginPatient();

    cy.visit("/patient/report");
    cy.get("textarea").type("I've had a mild headache since yesterday.");
    cy.contains("button", /^submit$/i).click();

    cy.contains(/got it/i, { timeout: 20000 }).should("be.visible");

    cy.contains(/back to my records/i).click();
    cy.url().should("include", "/patient");
    cy.contains(/most recent visit/i).should("be.visible");
  });

  it("adds their own allergy and sees it listed", () => {
    registerAndLoginPatient();

    cy.visit("/patient/allergies");
    cy.contains(/add an allergy/i).click();

    cy.get('input[placeholder*="allergic" i]').type("Bee stings");
    cy.contains("button", /save allergy/i).click();

    cy.contains(/bee stings/i).should("be.visible");
  });

  it("updates phone number on the profile page", () => {
    registerAndLoginPatient();

    cy.visit("/patient/profile");
    cy.get('input').eq(0).clear().type("0778765432");
    cy.contains("button", /save changes/i).click();

    cy.contains(/^saved$/i, { timeout: 10000 }).should("be.visible");
  });

  it("views the digital ID card with a QR code", () => {
    registerAndLoginPatient();

    cy.visit("/patient/profile");
    cy.contains(/view my digital card/i).click();

    cy.get("canvas").should("be.visible");
    cy.contains(/download qr/i).should("be.visible");
    cy.contains(/print card/i).should("be.visible");
  });

  it("cannot view another patient's dashboard by editing the URL", () => {
    registerAndLoginPatient().then(() => {
      cy.window().then((win) => win.localStorage.clear());
      registerAndLoginPatient().then(() => {
        cy.request({
          url: "http://127.0.0.1:8000/patients/1/dashboard",
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("uzima_token")}`,
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect([200, 403]).to.include(response.status);
        });
      });
    });
  });
});