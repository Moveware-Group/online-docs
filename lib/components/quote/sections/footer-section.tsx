import type { QuotePageData } from './types';

interface Props {
  data: QuotePageData;
  /** Optional per-template background colour override (set via layout block config).
   *  Takes priority over the branding footerBgColor setting. */
  bgColorOverride?: string;
  /** Optional per-template text colour override. */
  textColorOverride?: string;
}

export function FooterSection({ data, bgColorOverride, textColorOverride }: Props) {
  const b = data.job.branding ?? {};

  const bgColor      = bgColorOverride   || b.footerBgColor   || '#ffffff';
  const textColor    = textColorOverride  || b.footerTextColor  || '#374151';
  const primaryColor = b.primaryColor     || data.primaryColor || '#1a56db';

  // Determine whether the footer background is dark so we can pick the right logo.
  // A simple luminance check: parse the hex and compare brightness.
  const isDarkBg = (() => {
    const hex = bgColor.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const bl = parseInt(hex.slice(4, 6), 16);
    // Perceived luminance formula (ITU-R BT.709)
    return (0.2126 * r + 0.7152 * g + 0.0722 * bl) < 128;
  })();

  // Prefer the light logo on dark backgrounds; fall back to the standard logo.
  const logoUrl = (isDarkBg && b.logoUrlLight)
    ? b.logoUrlLight
    : (b.logoUrl || data.logoUrl);

  const companyName  = b.companyName      || data.companyName;
  const year         = new Date().getFullYear();

  const hasContact =
    b.footerAddressLine1 ||
    b.footerAddressLine2 ||
    b.footerPhone ||
    b.footerEmail ||
    b.footerAbn;

  return (
    <footer
      className="w-full mt-0 no-print-break"
      style={{ backgroundColor: bgColor, borderTop: `1px solid ${textColor}20` }}
    >
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">

          {/* ── Left: Logo + copyright ──────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                style={{ maxWidth: '160px', maxHeight: '60px', objectFit: 'contain' }}
              />
            ) : (
              <span className="text-lg font-bold" style={{ color: primaryColor }}>
                {companyName}
              </span>
            )}

            <p className="text-xs" style={{ color: textColor }}>
              &copy;{year}, {companyName}. All rights reserved.
            </p>

            <p className="text-xs" style={{ color: textColor }}>
              Powered by{' '}
              <a
                href="https://www.moveware.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: primaryColor }}
              >
                Moveware
              </a>
            </p>
          </div>

          {/* ── Right: Company contact details ──────────────────────────── */}
          {hasContact && (
            <div className="flex flex-col gap-1 text-right text-sm" style={{ color: textColor }}>
              {b.footerAddressLine1 && <span>{b.footerAddressLine1}</span>}
              {b.footerAddressLine2 && <span>{b.footerAddressLine2}</span>}
              {b.footerPhone && <span>{b.footerPhone}</span>}
              {b.footerEmail && (
                <a
                  href={`mailto:${b.footerEmail}`}
                  className="hover:underline"
                  style={{ color: primaryColor }}
                >
                  {b.footerEmail}
                </a>
              )}
              {b.footerAbn && <span>ABN: {b.footerAbn}</span>}
              {companyName && (
                <span className="font-medium" style={{ color: primaryColor }}>
                  {companyName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
