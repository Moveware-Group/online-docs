import { describe, expect, it } from "@jest/globals";
import { GET, PUT } from "@/app/api/companies/[id]/settings/route";

describe("Companies Settings API Route", () => {
  it("exports route handlers", () => {
    expect(typeof GET).toBe("function");
    expect(typeof PUT).toBe("function");
  });
});
