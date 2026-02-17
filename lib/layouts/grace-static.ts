/**
 * Static Grace Quote Layout
 * Hand-crafted template matching Grace NZ reference screenshot exactly.
 */

export const GRACE_STATIC_LAYOUT = {
  version: 1,
  globalStyles: {
    fontFamily: "Arial, Helvetica, sans-serif",
    backgroundColor: "#ededed",
    maxWidth: "980px",
  },
  sections: [
    {
      id: "grace-document",
      type: "custom_html",
      visible: true,
      html: `
<div style="background:#ededed;padding:0;margin:0;">
  <!-- Main container with white background -->
  <div style="background:#ffffff;max-width:980px;margin:0 auto;border:1px solid #ccc;">
    
    <!-- Red header bar with grace branding -->
    <div style="background:#cc0000;padding:20px 24px;position:relative;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <!-- Left: grace: logo -->
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="background:#ffffff;padding:2px 8px;border-radius:2px;">
            <span style="color:#cc0000;font-size:11px;font-weight:700;text-transform:uppercase;">moving</span>
          </div>
          <div style="color:#ffffff;font-size:14px;font-weight:400;letter-spacing:0.5px;">grace:</div>
        </div>
        <!-- Right: Moving Quote title and date -->
        <div style="text-align:right;color:#ffffff;">
          <div style="font-size:32px;font-weight:700;line-height:1.1;margin-bottom:4px;">Moving Quote</div>
          <div style="font-size:14px;font-weight:400;">{{quoteDate}}</div>
        </div>
      </div>
    </div>

    <!-- Kiwi mascot banner section (placeholder) -->
    <div style="height:120px;background:#f5f5f5;border-bottom:1px solid #e5e7eb;position:relative;overflow:hidden;">
      <div style="display:flex;align-items:center;justify-content:space-around;height:100%;padding:0 40px;">
        <!-- Stacked grace boxes on left -->
        <div style="display:flex;flex-direction:column;gap:4px;opacity:0.7;">
          <div style="background:#d32f2f;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;text-align:center;">grace:</div>
          <div style="background:#d32f2f;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;text-align:center;">grace:</div>
          <div style="background:#d32f2f;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;text-align:center;">grace:</div>
        </div>
        <!-- Kiwi placeholders -->
        <div style="width:80px;height:80px;background:#fff;border:2px dashed #cc0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">Kiwi 1</div>
        <div style="width:80px;height:80px;background:#fff;border:2px dashed #cc0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">Kiwi 2</div>
        <div style="width:80px;height:80px;background:#fff;border:2px dashed #cc0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;">Kiwi 3</div>
        <!-- Large grace: watermark on right -->
        <div style="font-size:80px;font-weight:700;color:rgba(204,0,0,0.12);line-height:1;letter-spacing:-2px;">grace:</div>
      </div>
    </div>

    <!-- Thank you section -->
    <div style="margin:24px;padding:24px;background:#ffffff;border:1px solid #e5e7eb;">
      <div style="display:flex;align-items:flex-start;gap:20px;">
        <!-- Left: Grace logo watermark -->
        <div style="font-size:42px;font-weight:700;color:rgba(204,0,0,0.15);line-height:1;flex-shrink:0;">grace:</div>
        <!-- Right: Content -->
        <div style="flex:1;">
          <h2 style="font-size:28px;font-weight:700;color:#222;margin:0 0 16px 0;">Thank you for choosing Grace</h2>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px 24px;font-size:14px;color:#333;">
            <div><strong style="font-weight:700;">Prepared for:</strong> <span style="font-weight:400;">{{customerName}}</span></div>
            <div><strong style="font-weight:700;">Quote ref#:</strong> <span style="font-weight:400;">{{job.id}}</span></div>
            <div><strong style="font-weight:700;">Quote author:</strong> <span style="font-weight:400;">Consultant Name</span></div>
            <div><strong style="font-weight:700;">Survey consultant:</strong> <span style="font-weight:400;">N/A</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Moving locations -->
    <div style="margin:0 24px 24px;">
      <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 8px 0;padding-bottom:6px;border-bottom:3px solid #cc0000;">Moving locations</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px;">
        <div style="font-size:13px;color:#333;">
          <div style="font-weight:700;margin-bottom:4px;">Packing from</div>
          <div style="font-weight:400;">{{job.upliftLine1}}</div>
          <div style="font-weight:400;">{{job.upliftCity}}, {{job.upliftState}} {{job.upliftPostcode}}</div>
          <div style="font-weight:400;">{{job.upliftCountry}}</div>
        </div>
        <div style="font-size:13px;color:#333;">
          <div style="font-weight:700;margin-bottom:4px;">From info</div>
          <div style="font-weight:400;">Details about origin location can be placed here.</div>
        </div>
        <div style="font-size:13px;color:#333;">
          <div style="font-weight:700;margin-bottom:4px;">Moving to/na</div>
          <div style="font-weight:400;">{{job.deliveryLine1}}</div>
          <div style="font-weight:400;">{{job.deliveryCity}}, {{job.deliveryState}} {{job.deliveryPostcode}}</div>
          <div style="font-weight:400;">{{job.deliveryCountry}}</div>
        </div>
      </div>
    </div>

    <!-- GraceCover -->
    <div style="margin:0 24px 24px;padding:20px;background:#f9f9f9;">
      <h3 style="font-size:24px;font-weight:700;font-style:italic;color:#333;margin:0 0 12px 0;">GraceCover</h3>
      <div style="font-size:13px;color:#444;line-height:1.6;">
        <p style="margin:0 0 8px 0;">Description of insurance options and details about policy coverages.</p>
        <p style="margin:0;">More detailed descriptions and terms.</p>
      </div>
    </div>

    <!-- Option 1 - Choose For -->
    <div style="margin:0 24px 2px;">
      <div style="background:#cc0000;color:#ffffff;font-size:16px;font-weight:700;padding:8px 12px;">Option 1 - Choose For</div>
    </div>
    <div style="margin:0 24px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Description</th>
            <th style="text-align:center;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Quantity</th>
            <th style="text-align:right;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Rate</th>
            <th style="text-align:right;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each costings}}
          <tr style="border-bottom:1px solid #ececec;">
            <td style="padding:10px 12px;">{{this.description}}</td>
            <td style="padding:10px 12px;text-align:center;">{{this.quantity}}</td>
            <td style="padding:10px 12px;text-align:right;">\${{this.rate}}</td>
            <td style="padding:10px 12px;text-align:right;">\${{this.totalPrice}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      <!-- Summary box -->
      <div style="margin-top:12px;padding:16px;background:#f9f9f9;border:1px solid #e5e7eb;">
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:14px;">
          <div style="font-weight:400;">Subtotal:</div>
          <div style="font-weight:700;text-align:right;">\${{job.jobValue}}</div>
          <div style="font-weight:400;">GST:</div>
          <div style="font-weight:700;text-align:right;">\$0.00</div>
          <div style="font-weight:700;font-size:16px;color:#cc0000;">Total:</div>
          <div style="font-weight:700;font-size:16px;color:#cc0000;text-align:right;">\${{job.jobValue}}</div>
        </div>
        <button style="margin-top:16px;width:100%;background:#cc0000;color:#fff;border:none;padding:12px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;">Select</button>
      </div>
    </div>

    <!-- Option 2 - Packing/Unpacking Extras -->
    <div style="margin:0 24px 2px;">
      <div style="background:#cc0000;color:#ffffff;font-size:16px;font-weight:700;padding:8px 12px;">Option 2 - Packing/Unpacking Extras</div>
    </div>
    <div style="margin:0 24px 24px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Description</th>
            <th style="text-align:center;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Quantity</th>
            <th style="text-align:right;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Rate</th>
            <th style="text-align:right;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Total</th>
          </tr>
        </thead>
        <tbody>
          {{#each costings}}
          <tr style="border-bottom:1px solid #ececec;">
            <td style="padding:10px 12px;">{{this.description}}</td>
            <td style="padding:10px 12px;text-align:center;">{{this.quantity}}</td>
            <td style="padding:10px 12px;text-align:right;">\${{this.rate}}</td>
            <td style="padding:10px 12px;text-align:right;">\${{this.totalPrice}}</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      <div style="margin-top:12px;padding:16px;background:#f9f9f9;border:1px solid #e5e7eb;">
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;font-size:14px;">
          <div style="font-weight:400;">Subtotal:</div>
          <div style="font-weight:700;text-align:right;">\${{job.jobValue}}</div>
          <div style="font-weight:400;">GST:</div>
          <div style="font-weight:700;text-align:right;">\$0.00</div>
          <div style="font-weight:700;font-size:16px;color:#cc0000;">Total:</div>
          <div style="font-weight:700;font-size:16px;color:#cc0000;text-align:right;">\${{job.jobValue}}</div>
        </div>
        <button style="margin-top:16px;width:100%;background:#cc0000;color:#fff;border:none;padding:12px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;">Select</button>
      </div>
    </div>

    <!-- Accept quote section -->
    <div style="margin:0 24px 24px;">
      <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 16px 0;">Accept quote</h3>
      <div style="padding:20px;background:#ffffff;border:1px solid #e5e7eb;">
        <div style="font-size:13px;color:#444;line-height:1.6;margin-bottom:20px;">
          <p style="margin:0 0 8px 0;">To confirm this booking, please review all details above, provide your signature below, and click "Accept".</p>
        </div>
        <!-- Signature area -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:6px;">Signature</label>
          <div style="border:1px solid #d1d5db;height:80px;background:#fafafa;"></div>
        </div>
        <!-- Type signature input -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:6px;">Type signature</label>
          <input type="text" style="width:100%;border:1px solid #d1d5db;padding:8px 12px;font-size:13px;" placeholder="Enter your name" />
        </div>
        <!-- Date picker -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:6px;">Date</label>
          <input type="text" style="width:200px;border:1px solid #d1d5db;padding:8px 12px;font-size:13px;" value="{{quoteDate}}" />
        </div>
        <!-- Checkbox and accept button -->
        <div style="margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:#333;cursor:pointer;">
            <input type="checkbox" style="width:16px;height:16px;" />
            <span>I agree to the terms and conditions</span>
          </label>
        </div>
        <button style="background:#cc0000;color:#fff;border:none;padding:12px 32px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;">Accept</button>
      </div>
    </div>

    <!-- Included items / Inventory -->
    <div style="margin:0 24px 32px;">
      <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 12px 0;">Included items</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="text-align:left;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Description</th>
            <th style="text-align:left;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Room</th>
            <th style="text-align:center;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Quantity</th>
            <th style="text-align:right;padding:10px 12px;font-weight:700;border-bottom:1px solid #d1d5db;">Dimensions</th>
          </tr>
        </thead>
        <tbody>
          {{#each inventory}}
          <tr style="border-bottom:1px solid #ececec;">
            <td style="padding:10px 12px;">{{this.description}}</td>
            <td style="padding:10px 12px;">{{this.room}}</td>
            <td style="padding:10px 12px;text-align:center;">{{this.quantity}}</td>
            <td style="padding:10px 12px;text-align:right;">{{this.cube}} m³</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
    </div>

  </div>
</div>`,
    },
  ],
};
