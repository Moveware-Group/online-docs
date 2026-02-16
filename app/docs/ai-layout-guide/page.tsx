import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AILayoutGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/settings/layout-builder"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Layout Builder
        </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Layout Builder Guide</h1>

          <div className="prose prose-sm max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Overview</h2>
            <p className="text-gray-700 mb-4">
              The AI Layout Builder allows you to create custom quote page layouts for specific clients using AI assistance.
              This guide explains how to use it effectively, especially when matching an existing reference layout.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
              <h3 className="text-lg font-bold text-amber-900 mb-2">⚠️ Important Limitation</h3>
              <p className="text-amber-800">
                <strong>CRITICAL</strong>: The AI cannot access or view reference URLs. It relies entirely on your written
                description to understand what the layout should look like. When you provide a reference URL, you{' '}
                <strong>must</strong> also provide a very detailed description.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How to Match a Reference Layout</h2>
            <p className="text-gray-700 mb-4">
              When you want the AI to replicate an existing quote layout:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Open the reference URL in your browser</h3>
            <p className="text-gray-700 mb-4">
              View the layout you want to match so you can describe it accurately.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Enter the reference URL in the form</h3>
            <p className="text-gray-700 mb-4">
              This stores the URL for documentation purposes and tells the AI you want to match an existing layout.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. Write a DETAILED description</h3>
            <p className="text-gray-700 mb-4">
              This is the most important step. Your description should include:
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Header Section</h4>
            <ul className="list-disc ml-6 mb-4 text-gray-700 space-y-1">
              <li>Logo placement (left, center, right)</li>
              <li>Background color or gradient (e.g., &quot;red #dc2626 on left transitioning to purple #7c3aed on right&quot;)</li>
              <li>Header content (quote number, dates, customer name)</li>
              <li>Text colors and alignment</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Section Order & Structure</h4>
            <p className="text-gray-700 mb-2">List each section in order, e.g.:</p>
            <ol className="list-decimal ml-6 mb-4 text-gray-700 space-y-1">
              <li>Header with logo and gradient</li>
              <li>Location Information (origin and destination)</li>
              <li>Quote Summary (volume, weight, delivery date)</li>
              <li>Service Options & Pricing</li>
              <li>Complete Inventory table</li>
              <li>Acceptance form</li>
              <li>Terms and conditions</li>
            </ol>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Styling Details</h4>
            <ul className="list-disc ml-6 mb-4 text-gray-700 space-y-1">
              <li>Font families used</li>
              <li>Background colors (e.g., &quot;white background&quot;, &quot;light gray #f9fafb&quot;)</li>
              <li>Card/section styling (borders, shadows, padding)</li>
              <li>Button colors and styles</li>
              <li>Table styling</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Color Scheme</h4>
            <ul className="list-disc ml-6 mb-4 text-gray-700 space-y-1">
              <li>Primary color and where it&apos;s used</li>
              <li>Secondary color and where it&apos;s used</li>
              <li>Accent colors</li>
              <li>Text colors (headings, body text, labels)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Example: Good Description</h3>
            <p className="text-gray-700 mb-2">
              Here&apos;s an example of a detailed description for Grace New Zealand&apos;s layout:
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-sm font-mono text-gray-800">
              <p className="mb-2">
                This is the new quote format for Grace New Zealand. The order is the main difference, as is the header banner layout.
              </p>
              <p className="font-bold mt-4 mb-2">HEADER:</p>
              <ul className="list-none ml-2 space-y-1">
                <li>- Full-width gradient banner from red (#dc2626) on the left to purple (#7c3aed) on the right</li>
                <li>- Crown Worldwide logo on the left side of the header</li>
                <li>- &quot;Moving Quote&quot; title in white text, large font</li>
                <li>- Quote number (#11505) displayed below title</li>
                <li>- Date and Valid until displayed on the top right of the header in white text</li>
                <li>- Customer greeting &quot;Dear Mr Leigh Morrow,&quot; in bold below the header on white background</li>
              </ul>
              <p className="font-bold mt-4 mb-2">SECTIONS (in this exact order):</p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Introduction paragraph with white background</li>
                <li>Location Information - two-column layout showing Origin and Destination addresses</li>
                <li>Quote Summary section with: Estimated Volume (with superscript m³), Total Weight (in kg), Delivery Date - All in white cards with light borders</li>
                <li>Service Options & Pricing section showing the move package with price on the right</li>
                <li>Complete Inventory table with pagination, showing item, quantity, volume, and type columns</li>
                <li>Acceptance form with signature fields</li>
                <li>Terms and conditions at the bottom</li>
              </ol>
              <p className="font-bold mt-4 mb-2">STYLING:</p>
              <ul className="list-none ml-2 space-y-1">
                <li>- Clean, modern design with rounded corners on cards</li>
                <li>- White background for the page</li>
                <li>- Light gray borders on cards</li>
                <li>- Sans-serif font (Inter or similar)</li>
                <li>- Red color (#dc2626) used for section headings and labels</li>
                <li>- Proper spacing between sections</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Example: Poor Description (Don&apos;t do this)</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">
                ❌ &quot;Create a quote layout similar to the reference URL with a nice header and the standard sections.&quot;
              </p>
              <p className="text-red-700 text-sm mt-2">
                This is too vague. The AI needs specific details about colors, layout, and section order.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Tips for Success</h2>
            <ol className="list-decimal ml-6 mb-4 text-gray-700 space-y-2">
              <li><strong>Be specific about colors</strong>: Use hex codes or specific color names</li>
              <li><strong>Describe the exact section order</strong>: List sections in the order they appear</li>
              <li><strong>Mention gradients explicitly</strong>: If there&apos;s a gradient, describe the start and end colors</li>
              <li><strong>Note any unique styling</strong>: Rounded corners, shadows, borders, etc.</li>
              <li><strong>Describe the header in detail</strong>: This is usually the most customized part</li>
              <li><strong>Include font information</strong>: If you can identify the font family</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Refining the Layout</h2>
            <p className="text-gray-700 mb-4">After the initial generation:</p>
            <ol className="list-decimal ml-6 mb-4 text-gray-700 space-y-2">
              <li>Review the preview carefully</li>
              <li>
                Use the AI Chat to request specific changes, e.g.:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>&quot;The header gradient should go from left to right, not top to bottom&quot;</li>
                  <li>&quot;Move the Quote Summary section above the Service Options&quot;</li>
                  <li>&quot;Make the header banner darker red, use #dc2626&quot;</li>
                  <li>&quot;Add more spacing between sections&quot;</li>
                </ul>
              </li>
              <li>Be specific in your refinement requests</li>
              <li>You can regenerate multiple times until it matches</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Common Issues</h2>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Issue: AI creates a different color scheme</h4>
                <p className="text-gray-700">
                  <strong>Solution:</strong> Provide exact hex codes in your description, e.g., &quot;Use #dc2626 for red, #7c3aed for purple&quot;
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Issue: Sections are in the wrong order</h4>
                <p className="text-gray-700">
                  <strong>Solution:</strong> List sections with numbers in your description: &quot;1. Header, 2. Location Info, 3. Quote Summary...&quot;
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Issue: Header doesn&apos;t match</h4>
                <p className="text-gray-700">
                  <strong>Solution:</strong> Describe the header in great detail, including layout, colors, logo position, and content placement
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Issue: Styling is too different</h4>
                <p className="text-gray-700">
                  <strong>Solution:</strong> Mention specific CSS properties like &quot;rounded-lg corners&quot;, &quot;no shadows&quot;, &quot;1px light gray borders&quot;
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Saving and Activating</h2>
            <p className="text-gray-700 mb-4">Once the layout matches your requirements:</p>
            <ol className="list-decimal ml-6 mb-6 text-gray-700 space-y-1">
              <li>Click &quot;Approve & Save&quot; in the top right</li>
              <li>The layout will be activated for all future quotes for this company</li>
              <li>Test by generating a quote for the company</li>
            </ol>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Need Help?</h2>
            <p className="text-gray-700 mb-4">
              If you&apos;re having trouble getting the AI to match a layout after 3-4 attempts:
            </p>
            <ol className="list-decimal ml-6 mb-6 text-gray-700 space-y-2">
              <li>Take screenshots of the reference layout</li>
              <li>Use even more detailed descriptions</li>
              <li>Refine iteratively through the chat</li>
              <li>Consider breaking down your changes into smaller, specific requests</li>
            </ol>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-8">
              <p className="text-blue-800 font-medium">
                Remember: The AI is powerful but needs detailed instructions. The more specific your description, the better the result!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
