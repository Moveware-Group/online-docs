import { describe, expect, it } from "@jest/globals";
import { GET, POST, DELETE } from "@/app/api/companies/[id]/logo/route";

describe("Companies Logo API Route", () => {
  it("exports route handlers", () => {
    expect(typeof GET).toBe("function");
    expect(typeof POST).toBe("function");
describe("/api/companies/[id]/logo", () => {
  it("runs placeholder test", () => {
    expect(true).toBe(true);
import { describe, it, expect } from "@jest/globals";
import { GET, POST, DELETE } from "../../../app/api/companies/[id]/logo/route";

describe("Company logo route handlers", () => {
  it("exports GET handler", () => {
    expect(typeof GET).toBe("function");
  });

  it("exports POST handler", () => {
    expect(typeof POST).toBe("function");
  });

  it("exports DELETE handler", () => {
    expect(typeof DELETE).toBe("function");
  });
});
