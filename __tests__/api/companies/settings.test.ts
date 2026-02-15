import { describe, expect, it } from "@jest/globals";
import { GET, PUT } from "@/app/api/companies/[id]/settings/route";

describe("Companies Settings API Route", () => {
  it("exports route handlers", () => {
    expect(typeof GET).toBe("function");
describe("/api/companies/[id]/settings", () => {
  it("runs placeholder test", () => {
    expect(true).toBe(true);
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
