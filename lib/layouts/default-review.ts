/**
 * Default Review Layout — starter template for the customer review doc type.
 *
 * Used by the Layout Builder as a base when no existing review layout exists
 * for a company.  Staff can customise each block in the Layout Builder then
 * save to the company.
 *
 * Section component names must match the switch cases in the review renderer
 * and custom-layout-renderer.tsx → RenderSection.
 */

export const DEFAULT_REVIEW_LAYOUT = {
  version: 1,
  globalStyles: {
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#f9fafb',
    maxWidth: '768px',
  },
  sections: [
    // ── Company logo bar ──────────────────────────────────────────────────────
    {
      id: 'review-logo',
      label: 'Company Logo',
      type: 'custom_html',
      html: `<div style="background:#ffffff;padding:20px 32px;border-bottom:1px solid #e5e7eb;">
  <img
    src="{{branding.logoUrl}}"
    alt="{{branding.companyName}}"
    style="max-height:56px;max-width:200px;object-fit:contain;display:block;"
    onerror="this.style.display='none'"
  />
</div>`,
      visible: true,
    },

    // ── Hero / page heading ───────────────────────────────────────────────────
    {
      id: 'review-hero',
      label: 'Page Header',
      type: 'custom_html',
      html: `<div style="background:{{branding.primaryColor}};padding:48px 32px 56px;color:#ffffff;">
  <div style="max-width:768px;margin:0 auto;">
    <h1 style="font-size:2rem;font-weight:700;margin:0 0 10px;line-height:1.2;">Share Your Experience</h1>
    <p style="font-size:1.05rem;opacity:0.9;margin:0;line-height:1.6;">
      We&rsquo;d love to hear how your move went. Your feedback helps us continue to improve.
    </p>
  </div>
</div>`,
      visible: true,
    },

    // ── Review questions form (locked built-in block) ─────────────────────────
    {
      id: 'review-questions',
      label: 'Review Questions',
      type: 'built_in',
      component: 'ReviewQuestions',
      visible: true,
    },

    // ── Footer (locked built-in block) ────────────────────────────────────────
    {
      id: 'footer',
      label: 'Footer',
      type: 'built_in',
      component: 'FooterSection',
      visible: true,
      config: {},
    },
  ],
};
