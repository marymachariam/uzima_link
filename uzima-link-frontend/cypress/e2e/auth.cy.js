function randomSuffix() {
  return Math.floor(Math.random() * 1000000);
}

describe("Authentication", () => {
  it("registers a new patient and lands on their dashboard", () => {
    const suffix = randomSuffix();

    cy.visit("/register");
    cy.contains(/^patient$/i).click();

    cy.get('input[placeholder="Full name"]').type("Cypress Test Patient");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("01-01-1995");
    cy.get('input[placeholder="Gender"]').type("Female");
    cy.get('input[placeholder="Phone number"]').type(`07${suffix}`);
    cy.get('input[placeholder="National ID"]').type(`${suffix}`);
    cy.get('input[type="email"]').type(`patient${suffix}@cypresstest.com`);
    cy.get('input[type="password"]').type("password123");

    cy.contains("button", /register/i).click();

    cy.url().should("include", "/patient");
    cy.contains(/welcome/i).should("be.visible");
  });

  it("registers a new doctor and lands on the queue", () => {
    const suffix = randomSuffix();

    cy.visit("/register");
    cy.contains(/^doctor$/i).click();

    cy.get('input[placeholder="Full name"]').type("Cypress Test Doctor");
    cy.get('input[type="email"]').type(`doctor${suffix}@cypresstest.com`);
    cy.get('input[type="password"]').type("password123");
    cy.get('input[placeholder="Facility invite code"]').type("NAIROBI2026");

    cy.contains("button", /register/i).click();

    cy.url().should("include", "/doctor");
  });

  it("rejects registration with a short password", () => {
    const suffix = randomSuffix();

    cy.visit("/register");
    cy.get('input[placeholder="Full name"]').type("Test User");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("01-01-1995");
    cy.get('input[placeholder="Gender"]').type("Male");
    cy.get('input[type="email"]').type(`shortpw${suffix}@cypresstest.com`);
    cy.get('input[type="password"]').type("abc");

    cy.contains("button", /register/i).click();

    cy.contains(/at least 6 characters/i).should("be.visible");
    cy.url().should("include", "/register");
  });

  it("logs in an existing user and redirects correctly", () => {
    const suffix = randomSuffix();
    const email = `logintest${suffix}@cypresstest.com`;

    cy.visit("/register");
    cy.contains(/^patient$/i).click();
    cy.get('input[placeholder="Full name"]').type("Login Test");
    cy.get('input[placeholder="Date of birth (DD-MM-YYYY)"]').type("01-01-1995");
    cy.get('input[placeholder="Gender"]').type("Female");
    cy.get('input[placeholder="Phone number"]').type(`08${suffix}`);
    cy.get('input[placeholder="National ID"]').type(`8${suffix}`);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("password123");
    cy.contains("button", /register/i).click();

    cy.url().should("include", "/patient");
    cy.window().then((win) => win.localStorage.clear());

    cy.visit("/login");
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type("password123");
    cy.contains("button", /log in/i).click();

    cy.url().should("include", "/patient");
  });

  it("rejects login with wrong password", () => {
    cy.visit("/login");
    cy.get('input[type="email"]').type("nonexistent@cypresstest.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.contains("button", /log in/i).click();

    cy.contains(/invalid email or password/i).should("be.visible");
    cy.url().should("include", "/login");
  });

  it("redirects unauthenticated users away from protected pages", () => {
    cy.window().then((win) => win.localStorage.clear());
    cy.visit("/doctor");
    cy.url().should("include", "/login");
  });
});