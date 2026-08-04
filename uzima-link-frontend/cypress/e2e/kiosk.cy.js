function randomSuffix() {
  return Math.floor(Math.random() * 1000000);
}

function registerAndLoginKiosk() {
  const suffix = randomSuffix();
  const email = `kiosk${suffix}@cypresstest.com`;

  cy.visit("/register");
  cy.contains(/^kiosk operator$/i).click();
  cy.get('input[placeholder="Full name"]').type("Cypress Kiosk Operator");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type("password123");
  cy.get('input[placeholder="Facility invite code"]').type("NAIROBI2026");
  cy.contains("button", /register/i).click();
  cy.url().should("include", "/kiosk");
}

describe("Kiosk flow", () => {
  beforeEach(() => {
    registerAndLoginKiosk();
  });

  it("registers a new patient with an allergy, then reaches intake", () => {
    const suffix = randomSuffix();

    cy.contains(/new patient/i).click();
    cy.get('input[placeholder="Full name"]').type("Cypress Kiosk Patient");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("15-03-1988");
    cy.get('input[placeholder="Gender"]').type("Male");
    cy.get('input[placeholder="Phone number"]').type(`09${suffix}`);
    cy.get('input[placeholder="National ID"]').type(`9${suffix}`);
    cy.get('input[placeholder="Allergen"]').type("Penicillin");

    cy.contains("button", /register & continue/i).click();

    cy.url().should("include", "/kiosk/intake/");
    cy.contains(/how you are feeling today/i).should("be.visible");
  });

  it("submits a text complaint through intake and sees the thank-you screen", () => {
    const suffix = randomSuffix();

    cy.contains(/new patient/i).click();
    cy.get('input[placeholder="Full name"]').type("Cypress Intake Patient");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("20-06-1975");
    cy.get('input[placeholder="Gender"]').type("Female");
    cy.get('input[placeholder="Phone number"]').type(`06${suffix}`);
    cy.get('input[placeholder="National ID"]').type(`6${suffix}`);
    cy.contains("button", /register & continue/i).click();

    cy.url().should("include", "/kiosk/intake/");

    cy.get("textarea").type("I have had a headache since this morning and feel dizzy.");
    cy.contains("button", /^submit$/i).click();

    cy.contains(/thank you/i).should("be.visible");
  });

  it("shows a not-found confirmation for an unknown phone number", () => {
    cy.get('input[placeholder*="phone" i]').type("0700000000");
    cy.contains("button", /look up patient/i).click();

    cy.contains(/no record found/i).should("be.visible");
    cy.contains(/yes, register new patient/i).should("be.visible");
  });

  it("finds a just-registered patient by phone number", () => {
    const suffix = randomSuffix();
    const phone = `05${suffix}`;

    cy.contains(/new patient/i).click();
    cy.get('input[placeholder="Full name"]').type("Findable Patient");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("10-10-1990");
    cy.get('input[placeholder="Gender"]').type("Male");
    cy.get('input[placeholder="Phone number"]').type(phone);
    cy.get('input[placeholder="National ID"]').type(`5${suffix}`);
    cy.contains("button", /register & continue/i).click();
    cy.url().should("include", "/kiosk/intake/");

    cy.visit("/kiosk");
    cy.get('input[placeholder*="phone" i]').type(phone);
    cy.contains("button", /look up patient/i).click();

    cy.url().should("include", "/kiosk/intake/");
  });
});