import { describe, expect, it } from "vitest";
import { isLegalOperatorComplete, parseLegalOperator } from "@/lib/legal";

describe("parseLegalOperator", () => {
  it("splits the address into lines and trims values", () => {
    const operator = parseLegalOperator({
      LEGAL_NAME: " Max Mustermann ",
      LEGAL_ADDRESS: "Musterstraße 1,  12345 Berlin ,",
      LEGAL_EMAIL: "kontakt@example.com",
      LEGAL_PHONE: "",
    });
    expect(operator).toEqual({
      name: "Max Mustermann",
      address: ["Musterstraße 1", "12345 Berlin"],
      email: "kontakt@example.com",
      phone: null,
      hosting: null,
      mailProvider: null,
    });
    expect(isLegalOperatorComplete(operator)).toBe(true);
  });

  it("treats a missing e-mail address as incomplete", () => {
    const operator = parseLegalOperator({ LEGAL_NAME: "Max", LEGAL_ADDRESS: "Musterstraße 1, 12345 Berlin" });
    expect(isLegalOperatorComplete(operator)).toBe(false);
    expect(isLegalOperatorComplete(parseLegalOperator({}))).toBe(false);
  });
});
