/**
 * Static Grace Quote Layout
 * Using actual Grace HTML assets and matching reference screenshot exactly.
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
<div style="background:#ededed;margin:0;padding:0;">
  <!-- Main container -->
  <div style="max-width:980px;margin:0 auto;background:#ffffff;">
    
    <!-- Banner header with kiwi mascots -->
    <div style="position:relative;width:100%;overflow:hidden;">
      <img src="/grace-assets/banner_1.png" alt="Grace Banner" style="width:100%;height:auto;display:block;" />
      <!-- Overlay positioning for "Moving Quote" title -->
      <div style="position:absolute;top:20px;right:24px;text-align:right;z-index:10;">
        <div style="background:rgba(204,0,0,0.95);color:#ffffff;padding:8px 20px;display:inline-block;">
          <div style="font-size:36px;font-weight:700;line-height:1.1;margin-bottom:2px;">Moving Quote</div>
          <div style="font-size:14px;font-weight:400;">{{quoteDate}}</div>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div style="padding:24px 32px;">
      
      <!-- Thank you section -->
      <div style="background:#ffffff;border:1px solid #e5e7eb;padding:24px;margin-bottom:24px;">
        <div style="display:flex;align-items:flex-start;gap:20px;">
          <img src="/grace-assets/logo.png" alt="Grace Logo" style="width:80px;height:auto;flex-shrink:0;opacity:0.85;" />
          <div style="flex:1;">
            <h2 style="font-size:28px;font-weight:700;color:#222;margin:0 0 16px 0;">Thank you for choosing Grace</h2>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px 32px;font-size:14px;color:#333;">
              <div><strong style="font-weight:700;">Prepared for:</strong> <span style="font-weight:400;">{{customerName}}</span></div>
              <div><strong style="font-weight:700;">Quote ref#:</strong> <span style="font-weight:400;">{{job.id}}</span></div>
              <div><strong style="font-weight:700;">Quote author:</strong> <span style="font-weight:400;">Consultant Name</span></div>
              <div><strong style="font-weight:700;">Survey consultant:</strong> <span style="font-weight:400;">N/A</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Moving locations -->
      <div style="margin-bottom:24px;">
        <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 4px 0;padding-bottom:8px;border-bottom:3px solid #cc0000;">Moving locations</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;">
          <div style="font-size:13px;color:#333;">
            <div style="font-weight:700;margin-bottom:6px;color:#cc0000;">Packing from</div>
            <div style="font-weight:400;">{{job.upliftLine1}}</div>
            <div style="font-weight:400;">{{job.upliftCity}}, {{job.upliftState}} {{job.upliftPostcode}}</div>
            <div style="font-weight:400;">{{job.upliftCountry}}</div>
          </div>
          <div style="font-size:13px;color:#333;">
            <div style="font-weight:700;margin-bottom:6px;color:#cc0000;">From info</div>
            <div style="font-weight:400;">Details about origin location can be placed here.</div>
          </div>
          <div style="font-size:13px;color:#333;">
            <div style="font-weight:700;margin-bottom:6px;color:#cc0000;">Moving to/na</div>
            <div style="font-weight:400;">{{job.deliveryLine1}}</div>
            <div style="font-weight:400;">{{job.deliveryCity}}, {{job.deliveryState}} {{job.deliveryPostcode}}</div>
            <div style="font-weight:400;">{{job.deliveryCountry}}</div>
          </div>
        </div>
      </div>

      <!-- GraceCover -->
      <div style="background:#f9f9f9;padding:20px;margin-bottom:24px;border-left:4px solid #cc0000;">
        <h3 style="font-size:24px;font-weight:700;font-style:italic;color:#333;margin:0 0 12px 0;">GraceCover</h3>
        <div style="font-size:13px;color:#444;line-height:1.6;">
          <p style="margin:0 0 8px 0;">Description of insurance options and details about policy coverages.</p>
          <p style="margin:0;">More detailed descriptions and terms.</p>
        </div>
      </div>

      <!-- Option 1 - Choose For -->
      <div style="margin-bottom:2px;">
        <div style="background:#cc0000;color:#ffffff;font-size:16px;font-weight:700;padding:10px 16px;">Option 1 - Choose For</div>
      </div>
      <div style="margin-bottom:24px;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;">Description</th>
              <th style="text-align:center;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:100px;">Quantity</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:120px;">Rate</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each costings}}
            <tr style="border-bottom:1px solid #ececec;">
              <td style="padding:12px 16px;">{{this.description}}</td>
              <td style="padding:12px 16px;text-align:center;">{{this.quantity}}</td>
              <td style="padding:12px 16px;text-align:right;">\${{this.rate}}</td>
              <td style="padding:12px 16px;text-align:right;font-weight:600;">\${{this.totalPrice}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        <!-- Summary box -->
        <div style="padding:20px;background:#fafafa;border-top:2px solid #e5e7eb;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:10px;font-size:14px;max-width:400px;margin-left:auto;">
            <div style="font-weight:400;color:#666;">Subtotal:</div>
            <div style="font-weight:700;text-align:right;color:#333;">\${{job.jobValue}}</div>
            <div style="font-weight:400;color:#666;">GST:</div>
            <div style="font-weight:700;text-align:right;color:#333;">\$0.00</div>
            <div style="font-weight:700;font-size:16px;color:#cc0000;padding-top:8px;border-top:2px solid #cc0000;">Total:</div>
            <div style="font-weight:700;font-size:16px;color:#cc0000;text-align:right;padding-top:8px;border-top:2px solid #cc0000;">\${{job.jobValue}}</div>
          </div>
          <button style="margin-top:20px;width:100%;background:#cc0000;color:#fff;border:none;padding:14px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;transition:background 0.2s;">Select</button>
        </div>
      </div>

      <!-- Option 2 - Packing/Unpacking Extras -->
      <div style="margin-bottom:2px;">
        <div style="background:#cc0000;color:#ffffff;font-size:16px;font-weight:700;padding:10px 16px;">Option 2 - Packing/Unpacking Extras</div>
      </div>
      <div style="margin-bottom:24px;border:1px solid #e5e7eb;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;">Description</th>
              <th style="text-align:center;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:100px;">Quantity</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:120px;">Rate</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each costings}}
            <tr style="border-bottom:1px solid #ececec;">
              <td style="padding:12px 16px;">{{this.description}}</td>
              <td style="padding:12px 16px;text-align:center;">{{this.quantity}}</td>
              <td style="padding:12px 16px;text-align:right;">\${{this.rate}}</td>
              <td style="padding:12px 16px;text-align:right;font-weight:600;">\${{this.totalPrice}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        <div style="padding:20px;background:#fafafa;border-top:2px solid #e5e7eb;">
          <div style="display:grid;grid-template-columns:1fr auto;gap:10px;font-size:14px;max-width:400px;margin-left:auto;">
            <div style="font-weight:400;color:#666;">Subtotal:</div>
            <div style="font-weight:700;text-align:right;color:#333;">\${{job.jobValue}}</div>
            <div style="font-weight:400;color:#666;">GST:</div>
            <div style="font-weight:700;text-align:right;color:#333;">\$0.00</div>
            <div style="font-weight:700;font-size:16px;color:#cc0000;padding-top:8px;border-top:2px solid #cc0000;">Total:</div>
            <div style="font-weight:700;font-size:16px;color:#cc0000;text-align:right;padding-top:8px;border-top:2px solid #cc0000;">\${{job.jobValue}}</div>
          </div>
          <button style="margin-top:20px;width:100%;background:#cc0000;color:#fff;border:none;padding:14px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;transition:background 0.2s;">Select</button>
        </div>
      </div>

      <!-- Accept quote section -->
      <div style="margin-bottom:24px;">
        <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 16px 0;">Accept quote</h3>
        <div style="padding:24px;background:#ffffff;border:1px solid #e5e7eb;">
          <div style="font-size:13px;color:#444;line-height:1.6;margin-bottom:20px;">
            <p style="margin:0 0 8px 0;">To confirm this booking, please review all details above, provide your signature below, and click "Accept".</p>
          </div>
          <!-- Signature canvas area -->
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">Signature</label>
            <div style="border:2px solid #d1d5db;height:100px;background:#fafafa;border-radius:4px;"></div>
          </div>
          <!-- Type signature input -->
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">Type signature</label>
            <input type="text" style="width:100%;border:1px solid #d1d5db;padding:10px 14px;font-size:14px;border-radius:4px;" placeholder="Enter your name" />
          </div>
          <!-- Date picker -->
          <div style="margin-bottom:20px;">
            <label style="display:block;font-size:13px;font-weight:700;color:#333;margin-bottom:8px;">Date</label>
            <input type="text" style="width:250px;border:1px solid #d1d5db;padding:10px 14px;font-size:14px;border-radius:4px;" value="{{quoteDate}}" readonly />
          </div>
          <!-- Checkbox and accept button -->
          <div style="margin-bottom:20px;">
            <label style="display:flex;align-items:center;gap:10px;font-size:13px;color:#333;cursor:pointer;">
              <input type="checkbox" style="width:18px;height:18px;cursor:pointer;" />
              <span>I agree to the terms and conditions</span>
            </label>
          </div>
          <button style="background:#cc0000;color:#fff;border:none;padding:14px 40px;font-size:15px;font-weight:700;border-radius:4px;cursor:pointer;transition:background 0.2s;">Accept</button>
        </div>
      </div>

      <!-- Included items / Inventory -->
      <div style="margin-bottom:32px;">
        <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 12px 0;">Included items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;">Description</th>
              <th style="text-align:left;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:150px;">Room</th>
              <th style="text-align:center;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:100px;">Quantity</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;border-bottom:2px solid #d1d5db;width:120px;">Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {{#each inventory}}
            <tr style="border-bottom:1px solid #ececec;">
              <td style="padding:12px 16px;">{{this.description}}</td>
              <td style="padding:12px 16px;">{{this.room}}</td>
              <td style="padding:12px 16px;text-align:center;">{{this.quantity}}</td>
              <td style="padding:12px 16px;text-align:right;">{{this.cube}} m³</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
      </div>

    </div>

    <!-- Footer banner -->
    <div style="width:100%;overflow:hidden;">
      <img src="/grace-assets/banner_3.png" alt="Grace Footer" style="width:100%;height:auto;display:block;" />
    </div>

  </div>
</div>`,
    },
  ],
};
