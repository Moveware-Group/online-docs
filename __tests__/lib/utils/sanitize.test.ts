import { describe, expect, it } from "@jest/globals";
import {
  sanitizeHtml,
  sanitizeCompanyContent,
} from "../../../lib/utils/sanitize";

describe("sanitizeHtml", () => {
  describe("XSS prevention", () => {
    it("should remove script tags", () => {
      const input = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Hello</p><p>World</p>");
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("should remove onclick handlers", () => {
      const input = "<p onclick=\"alert('XSS')\">Click me</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Click me</p>");
      expect(result).not.toContain("onclick");
    });

    it("should remove onerror handlers", () => {
      const input = '<img src="x" onerror="alert(\'XSS\')">';
      const result = sanitizeHtml(input);
      expect(result).toBe("");
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("img");
    });

    it("should remove javascript: URLs in links", () => {
      const input = "<a href=\"javascript:alert('XSS')\">Click</a>";
      const result = sanitizeHtml(input);
      // Link should be removed or href should be stripped
      expect(result).not.toContain("javascript:");
    });

    it("should remove data: URLs in links", () => {
      const input =
        "<a href=\"data:text/html,<script>alert('XSS')</script>\">Click</a>";
      const result = sanitizeHtml(input);
      expect(result).not.toContain("data:");
    });

    it("should remove event handlers with various casing", () => {
      const input = '<p OnClick="alert(1)" ONMOUSEOVER="alert(2)">Test</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Test</p>");
      expect(result).not.toContain("OnClick");
      expect(result).not.toContain("ONMOUSEOVER");
    });

    it("should remove style tags", () => {
      const input = "<style>body { background: red; }</style><p>Content</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Content</p>");
      expect(result).not.toContain("style");
    });

    it("should remove iframe tags", () => {
      const input = '<iframe src="https://evil.com"></iframe><p>Content</p>';
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Content</p>");
      expect(result).not.toContain("iframe");
    });
  });

  describe("Allowed tags preservation", () => {
    it("should preserve p tags", () => {
      const input = "<p>This is a paragraph</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>This is a paragraph</p>");
    });

    it("should preserve br tags", () => {
      const input = "<p>Line 1<br>Line 2</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Line 1<br>Line 2</p>");
    });

    it("should preserve strong tags", () => {
      const input = "<p>This is <strong>bold</strong> text</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>This is <strong>bold</strong> text</p>");
    });

    it("should preserve em tags", () => {
      const input = "<p>This is <em>italic</em> text</p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>This is <em>italic</em> text</p>");
    });

    it("should preserve a tags with safe href", () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<a href="https://example.com">Link</a>');
    });

    it("should preserve mailto links", () => {
      const input = '<a href="mailto:test@example.com">Email</a>';
      const result = sanitizeHtml(input);
      expect(result).toBe('<a href="mailto:test@example.com">Email</a>');
    });

    it("should preserve nested allowed tags", () => {
      const input = "<p><strong><em>Bold and italic</em></strong></p>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p><strong><em>Bold and italic</em></strong></p>");
    });
  });

  describe("Disallowed tags removal", () => {
    it("should remove div tags", () => {
      const input = "<div>Content</div>";
      const result = sanitizeHtml(input);
      expect(result).toBe("Content");
      expect(result).not.toContain("div");
    });

    it("should remove span tags", () => {
      const input = "<span>Content</span>";
      const result = sanitizeHtml(input);
      expect(result).toBe("Content");
      expect(result).not.toContain("span");
    });

    it("should remove h1-h6 tags", () => {
      const input = "<h1>Title</h1><h2>Subtitle</h2>";
      const result = sanitizeHtml(input);
      expect(result).toBe("TitleSubtitle");
      expect(result).not.toContain("h1");
      expect(result).not.toContain("h2");
    });

    it("should remove img tags", () => {
      const input = '<img src="image.jpg" alt="Image">';
      const result = sanitizeHtml(input);
      expect(result).toBe("");
      expect(result).not.toContain("img");
    });
  });

  describe("Null and undefined handling", () => {
    it("should return empty string for null", () => {
      const result = sanitizeHtml(null);
      expect(result).toBe("");
    });

    it("should return empty string for undefined", () => {
      const result = sanitizeHtml(undefined);
      expect(result).toBe("");
    });

    it("should return empty string for empty string", () => {
      const result = sanitizeHtml("");
      expect(result).toBe("");
    });

    it("should return empty string for whitespace-only string", () => {
      const result = sanitizeHtml("   ");
      expect(result).toBe("");
    });
  });

  describe("Complex XSS payloads", () => {
    it("should handle mixed case tags", () => {
      const input = "<P>Text</P><sCrIpT>alert(1)</ScRiPt>";
      const result = sanitizeHtml(input);
      expect(result).toBe("<p>Text</p>");
      expect(result).not.toContain("alert");
    });

    it("should handle encoded characters", () => {
      const input = "<p>Normal</p>&#60;script&#62;alert(1)&#60;/script&#62;";
      const result = sanitizeHtml(input);
      expect(result).not.toContain("alert");
    });

    it("should handle multiple XSS attempts", () => {
      const input = `
        <p>Valid content</p>
        <script>alert('XSS1')</script>
        <img src=x onerror="alert('XSS2')">
        <a href="javascript:alert('XSS3')">Link</a>
        <p onclick="alert('XSS4')">Click</p>
      `;
      const result = sanitizeHtml(input);
      expect(result).toContain("Valid content");
      expect(result).not.toContain("alert");
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("onclick");
    });
  });
});

describe("sanitizeCompanyContent", () => {
  it("should sanitize hero_content field", () => {
    const input = {
      hero_content: '<p>Welcome</p><script>alert("XSS")</script>',
      other_field: "unchanged",
    };
    const result = sanitizeCompanyContent(input);
    expect(result.hero_content).toBe("<p>Welcome</p>");
    expect(result.other_field).toBe("unchanged");
  });

  it("should sanitize copy_content field", () => {
    const input = {
      copy_content: '<strong>About</strong><script>alert("XSS")</script>',
      other_field: "unchanged",
    };
    const result = sanitizeCompanyContent(input);
    expect(result.copy_content).toBe("<strong>About</strong>");
    expect(result.other_field).toBe("unchanged");
  });

  it("should sanitize both hero_content and copy_content", () => {
    const input = {
      hero_content: "<p>Hero</p><script>alert(1)</script>",
      copy_content: "<em>Copy</em><script>alert(2)</script>",
    };
    const result = sanitizeCompanyContent(input);
    expect(result.hero_content).toBe("<p>Hero</p>");
    expect(result.copy_content).toBe("<em>Copy</em>");
  });

  it("should handle null hero_content", () => {
    const input = {
      hero_content: null,
      copy_content: "<p>Valid</p>",
    };
    const result = sanitizeCompanyContent(input);
    expect(result.hero_content).toBe("");
    expect(result.copy_content).toBe("<p>Valid</p>");
  });

  it("should handle undefined copy_content", () => {
    const input = {
      hero_content: "<p>Valid</p>",
      copy_content: undefined,
    };
    const result = sanitizeCompanyContent(input);
    expect(result.hero_content).toBe("<p>Valid</p>");
    expect(result.copy_content).toBe("");
  });

  it("should not mutate the original object", () => {
    const input = {
      hero_content: "<p>Test</p><script>alert(1)</script>",
      copy_content: "<p>Test</p>",
    };
    const original = { ...input };
    sanitizeCompanyContent(input);
    expect(input.hero_content).toBe(original.hero_content);
  });

  it("should handle null input", () => {
    const result = sanitizeCompanyContent(null as any);
    expect(result).toBeNull();
  });

  it("should handle undefined input", () => {
    const result = sanitizeCompanyContent(undefined as any);
    expect(result).toBeUndefined();
  });

  it("should preserve other fields unchanged", () => {
    const input = {
      hero_content: "<p>Hero</p>",
      copy_content: "<p>Copy</p>",
      id: 123,
      name: "Company Name",
      active: true,
      metadata: { key: "value" },
    };
    const result = sanitizeCompanyContent(input);
    expect(result.id).toBe(123);
    expect(result.name).toBe("Company Name");
    expect(result.active).toBe(true);
    expect(result.metadata).toEqual({ key: "value" });
  });

  it("should work with objects without hero_content or copy_content", () => {
    const input = {
      id: 456,
      name: "Test",
    };
    const result = sanitizeCompanyContent(input);
    expect(result).toEqual(input);
  });
});
