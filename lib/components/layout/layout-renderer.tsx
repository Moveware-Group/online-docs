"use client";

import { LayoutConfig } from "@/lib/services/llm-service";
import { MockQuoteData } from "@/lib/data/mock-quote-data";
import { useMemo } from "react";

interface LayoutRendererProps {
  config: LayoutConfig;
  data: MockQuoteData;
}

/**
 * Simple Handlebars-like template renderer
 * Supports: {{variable}}, {{#if condition}}, {{#each array}}, {{this}}
 */
function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  // Replace {{variable}} with actual values
  result = result.replace(/\{\{([^}#/]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    
    // Handle {{this}} for current context
    if (trimmedPath === "this") {
      return String(data);
    }

    // Handle nested paths like job.firstName
    const value = trimmedPath.split(".").reduce((obj: any, key: string) => {
      return obj?.[key];
    }, data);

    return value !== undefined && value !== null ? String(value) : "";
  });

  // Handle {{#each array}} blocks
  result = result.replace(
    /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
    (match, arrayPath, content) => {
      const array = arrayPath.trim().split(".").reduce((obj: any, key: string) => {
        return obj?.[key];
      }, data);

      if (!Array.isArray(array)) return "";

      return array
        .map((item) => {
          // Create context with 'this' pointing to current item
          const itemContext = { ...data, this: item };
          return renderTemplate(content, itemContext);
        })
        .join("");
    }
  );

  // Handle {{#if condition}} blocks
  result = result.replace(
    /\{\{#if\s+([^}]+)\}\}([\s\S]*?)(\{\{\/if\}\}|\{\{\/\}\})/g,
    (match, condition, content) => {
      const value = condition.trim().split(".").reduce((obj: any, key: string) => {
        return obj?.[key];
      }, data);

      // Check if condition is truthy
      const isTrue = Boolean(value && (Array.isArray(value) ? value.length > 0 : true));
      return isTrue ? renderTemplate(content, data) : "";
    }
  );

  return result;
}

export function LayoutRenderer({ config, data }: LayoutRendererProps) {
  const renderedSections = useMemo(() => {
    return config.sections
      .filter((section) => section.visible !== false)
      .map((section) => {
        if (section.type === "custom_html" && section.html) {
          // Render HTML template with data
          const rendered = renderTemplate(section.html, data);
          return {
            ...section,
            renderedHtml: rendered,
          };
        }
        return section;
      });
  }, [config, data]);

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: config.globalStyles.fontFamily || "Inter, sans-serif",
        backgroundColor: config.globalStyles.backgroundColor || "#f9fafb",
      }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth: config.globalStyles.maxWidth || "1152px",
        }}
      >
        {/* Render custom global CSS if provided */}
        {config.globalStyles.customCss && (
          <style dangerouslySetInnerHTML={{ __html: config.globalStyles.customCss }} />
        )}

        {renderedSections.map((section) => (
          <div key={section.id} className="section">
            {section.type === "custom_html" && "renderedHtml" in section ? (
              <div>
                {/* Render custom CSS for this section */}
                {section.css && (
                  <style dangerouslySetInnerHTML={{ __html: section.css }} />
                )}
                
                {/* Render HTML content */}
                <div
                  dangerouslySetInnerHTML={{ __html: section.renderedHtml as string }}
                />
              </div>
            ) : section.type === "built_in" ? (
              // For built-in components, render placeholder for now
              <div className="p-6 bg-white rounded-lg border border-gray-200 my-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {section.component}
                </h3>
                <p className="text-sm text-gray-500">
                  Built-in component: {section.component}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
