import { describe, it, expect } from "@jest/globals";
import { GET, PUT } from "../../../app/api/companies/[id]/settings/route";

describe("Company settings route handlers", () => {
  it("exports GET handler", () => {
    expect(typeof GET).toBe("function");
  });

  it("exports PUT handler", () => {
    expect(typeof PUT).toBe("function");
  });
});
