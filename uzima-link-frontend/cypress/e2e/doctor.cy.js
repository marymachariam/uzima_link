function randomSuffix() {
  return Math.floor(Math.random() * 1000000);
}

function registerAndLoginDoctor() {
  const suffix = randomSuffix();
  const email = `doctor${suffix}@cypresstest.com`;

  cy.visit("/register");
  cy.contains(/^doctor$/i).click();
  cy.get('input[placeholder="Full name"]').type("Cypress Test Doctor");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type("password123");
  cy.get('input[placeholder="Facility invite code"]').type("NAIROBI2026");
  cy.contains("button", /register/i).click();
  cy.url().should("include", "/doctor");
}

function registerPatientViaKiosk(allergen = null) {
  const suffix = randomSuffix();
  const kioskEmail = `kioskfordoctor${suffix}@cypresstest.com`;
  const phone = `04${suffix}`;

  cy.window().then((win) => win.localStorage.clear());
  cy.visit("/register");
  cy.contains(/^kiosk operator$/i).click();
  cy.get('input[placeholder="Full name"]').type("Setup Kiosk");
  cy.get('input[type="email"]').type(kioskEmail);
  cy.get('input[type="password"]').type("password123");
  cy.get('input[placeholder="Facility invite code"]').type("NAIROBI2026");
  cy.contains("button", /register/i).click();
  cy.url().should("include", "/kiosk");

  cy.contains(/new patient/i).click();
  cy.get('input[placeholder="Full name"]').type("Doctor Test Patient");
  cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("05-05-1980");
  cy.get('input[placeholder="Gender"]').type("Female");
  cy.get('input[placeholder="Phone number"]').type(phone);
  cy.get('input[placeholder="National ID"]').type(`4${suffix}`);
  if (allergen) {
    cy.get('input[placeholder="Allergen"]').type(allergen);
  }
  cy.contains("button", /register & continue/i).click();
  cy.url().should("include", "/kiosk/intake/");

  cy.get("textarea").type("I have a fever and body aches.");
  cy.contains("button", /^submit$/i).click();
  cy.contains(/thank you/i, { timeout: 20000 }).should("be.visible");

  cy.window().then((win) => win.localStorage.clear());

  return cy.wrap(phone);
}

describe("Doctor flow", () => {
  it("finds a patient by phone and sees their dashboard", () => {
    registerPatientViaKiosk().then((phone) => {
      registerAndLoginDoctor();

      cy.visit("/doctor/search");
      cy.get('input[placeholder="Enter value"]').type(phone);
      cy.contains("button", /find patient/i).click();

      cy.url().should("include", "/doctor/patient/");
      cy.contains(/current presentation/i).should("be.visible");
    });
  });
  
it("shows an allergy alert for a patient with a recorded allergy", () => {
  registerPatientViaKiosk("Latex").then((phone) => {
    registerAndLoginDoctor();

    cy.visit("/doctor/search");
    cy.get('input[placeholder="Enter value"]').type(phone);
    cy.contains("button", /find patient/i).click();

    cy.url().should("include", "/doctor/patient/");
    cy.get('[class*="allergyBanner"]').should("be.visible").and("contain.text", "Latex");
  });
});

it("does not show an allergy alert for a patient with no allergies", () => {
  registerPatientViaKiosk().then((phone) => {
    registerAndLoginDoctor();

    cy.visit("/doctor/search");
    cy.get('input[placeholder="Enter value"]').type(phone);
    cy.contains("button", /find patient/i).click();

    cy.url().should("include", "/doctor/patient/");
    cy.contains(/current presentation/i).should("be.visible");
    cy.get('[class*="allergyBanner"]').should("not.exist");
  });
});

  it("saves doctor notes and they persist after reload", () => {
    registerPatientViaKiosk().then((phone) => {
      registerAndLoginDoctor();

      cy.visit("/doctor/search");
      cy.get('input[placeholder="Enter value"]').type(phone);
      cy.contains("button", /find patient/i).click();

      cy.url().should("include", "/doctor/patient/");

      cy.get("textarea").last().type("Prescribed rest and fluids.");
      cy.contains("button", /save notes/i).click();

      cy.reload();
      cy.get("textarea").last().should("have.value", "Prescribed rest and fluids.");
    });
  });

  it("shows the patient queue on the dashboard", () => {
    registerPatientViaKiosk().then(() => {
      registerAndLoginDoctor();
      cy.visit("/doctor");
      cy.contains(/recent patients/i).should("be.visible");
    });
  });
});

