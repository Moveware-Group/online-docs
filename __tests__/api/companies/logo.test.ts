import { describe, expect, it } from "@jest/globals";
import { GET, POST, DELETE } from "@/app/api/companies/[id]/logo/route";

describe("Companies Logo API Route", () => {
  it("exports route handlers", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
    expect(typeof DELETE).toBe("function");
  });
});
