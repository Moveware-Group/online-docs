/**
 * Default Quote Layout — uses the built-in React component sections.
 *
 * This mirrors what the quote page renders when no custom layout is assigned.
 * It can be saved as a Layout Template and assigned to companies so staff can
 * then customise it in the Layout Builder without affecting other companies.
 *
 * Section component names must match the switch cases in
 * custom-layout-renderer.tsx → RenderSection.
 */

export const DEFAULT_STATIC_LAYOUT = {
  version: 1,
  globalStyles: {
    fontFamily: "Inter, sans-serif",
    backgroundColor: "#f9fafb",
    maxWidth: "1152px",
  },
  sections: [
    {
      id: "default-header",
      label: "Header",
      type: "built_in",
      component: "HeaderSection",
      visible: true,
    },
    {
      id: "default-intro",
      label: "Introduction",
      type: "built_in",
      component: "IntroSection",
      visible: true,
    },
    {
      id: "default-locations",
      label: "Moving Locations",
      type: "built_in",
      component: "LocationInfo",
      visible: true,
    },
    {
      id: "default-pricing",
      label: "Pricing Options",
      type: "built_in",
      component: "EstimateCard",
      visible: true,
    },
    {
      id: "default-inventory",
      label: "Included Items",
      type: "built_in",
      component: "InventoryTable",
      visible: true,
    },
    {
      id: "default-acceptance",
      label: "Accept Quote",
      type: "built_in",
      component: "AcceptanceForm",
      visible: true,
    },
    {
      id: "default-terms",
      label: "Terms & Conditions",
      type: "built_in",
      component: "TermsSection",
      visible: true,
    },
  ],
};
