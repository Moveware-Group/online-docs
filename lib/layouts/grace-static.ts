/**
 * Static Grace Quote Layout
 * Using actual Grace HTML assets and matching reference screenshot exactly.
 */

export const GRACE_STATIC_LAYOUT = {
  version: 1,
  globalStyles: {
    fontFamily: "Arial, Helvetica, sans-serif",
    backgroundColor: "#e9e9e9",
    maxWidth: "980px",
  },
  sections: [
    {
      id: "grace-document",
      type: "custom_html",
      visible: true,
      html: `
<div style="background:#e9e9e9;margin:0;padding:0;">
  <!-- Full-width header: white bar with content inside container -->
  <div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;background:#ffffff;border-bottom:1px solid #e5e7eb;">
    <div style="max-width:980px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
      <img src="/grace-assets/logo.png" alt="Grace Logo" style="height:40px;width:auto;display:block;" />
      <div style="background:#cc0000;color:#ffffff;padding:8px 20px;border-radius:8px;font-size:16px;font-weight:600;">Hi {{customerName}}</div>
    </div>
  </div>
  <!-- Full-width red bar with content inside container -->
  <div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;background:#cc0000;color:#ffffff;">
    <div style="max-width:980px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:20px;font-weight:700;">Moving Proposal</span>
      <span style="font-size:14px;font-weight:400;">{{quoteDate}}</span>
    </div>
  </div>

  <!-- Main container (no background so #e9e9e9 shows through) -->
  <div style="max-width:980px;margin:0 auto;">
    <!-- Full-width hero banner (breaks out of container) -->
    <div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;">
      <img src="{{branding.heroBannerUrl}}" alt="Grace Banner" style="width:100%;height:auto;display:block;" onerror="this.src='/grace-assets/banner_1.png'" />
    </div>

    <!-- Main content area: first block overlaps hero banner (sits above it visually) -->
    <div style="padding:0 32px 24px 32px;margin-top:-80px;position:relative;z-index:1;">
      
      <!-- Thank you section (copy block - 1/3 + 2/3 layout) -->
      <div style="background:#ffffff;border:1px solid #e9e9e9;padding:24px;margin-bottom:50px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Heading with border below -->
        <h2 style="font-size:22px;font-weight:700;color:#cc0000;margin:0 0 16px 0;padding-bottom:16px;border-bottom:1px solid #e0e0e0;">Thank you for considering Grace</h2>
        <!-- 1/3 + 2/3 grid -->
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:32px;">
          <!-- Left: meta + consultant -->
          <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;">
            <div>
              <div style="font-weight:700;color:#111;margin-bottom:3px;">Prepared for</div>
              <div style="font-weight:400;color:#666;">{{customerName}}</div>
            </div>
            <div>
              <div style="font-weight:700;color:#111;margin-bottom:3px;">Proposal number</div>
              <div style="font-weight:400;color:#666;">#{{job.id}}</div>
            </div>
            <!-- Consultant name pill -->
            <div style="margin-top:auto;padding-top:20px;">
              <div style="display:inline-block;background:#f3f3f3;padding:10px 18px;border-radius:6px;">
                <span style="font-weight:700;color:#cc0000;font-size:14px;">{{customerName}}</span>
              </div>
            </div>
          </div>
          <!-- Right: letter body -->
          <div style="font-size:14px;line-height:1.7;color:#555;">
            <p style="margin:0 0 14px 0;color:#333;">Dear</p>
            <p style="margin:0 0 14px 0;">Thank you for your inquiry. Here is our proposal for your consideration.</p>
            <p style="margin:0 0 14px 0;">With over 100 years of experience, Grace has established itself as a trusted leader in household removals. With more than 30 branches across Australia, we are internationally recognised for excellence in household relocations.</p>
            <p style="margin:0 0 14px 0;">We appreciate that every move is unique. That's why we offer tailored, flexible services to meet your specific needs. Our team is dedicated to making your relocation as seamless and stress-free as possible.</p>
            <p style="margin:0 0 14px 0;">To accept, please review the service options, acknowledge the terms and conditions, and click the Acceptance button. If you have any questions or need assistance at all, please contact me directly.</p>
            <p style="margin:0 0 14px 0;">We look forward to taking care of your move.</p>
            <p style="margin:0;color:#555;">{{customerName}}</p>
          </div>
        </div>
      </div>

      <!-- Moving locations -->
      <div style="background:#ffffff;border:1px solid #e9e9e9;padding:28px 24px;margin-bottom:50px;border-radius:20px;">
        <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 0 0;padding-bottom:16px;border-bottom:1px solid #e0e0e0;">Moving locations</h3>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:20px;">
          <!-- Moving from -->
          <div style="font-size:14px;color:#555;">
            <div style="font-weight:700;color:#111;margin-bottom:10px;">Moving from</div>
            <div>{{job.upliftLine1}}</div>
            <div>{{job.upliftCity}} {{job.upliftState}}</div>
            <div>{{job.upliftCountry}}</div>
            <div>{{job.upliftPostcode}}</div>
          </div>
          <!-- Moving to -->
          <div style="font-size:14px;color:#555;">
            <div style="font-weight:700;color:#111;margin-bottom:10px;">Moving to</div>
            <div>{{job.deliveryLine1}}</div>
            <div>{{job.deliveryCity}} {{job.deliveryState}}</div>
            <div>{{job.deliveryCountry}}</div>
            <div>{{job.deliveryPostcode}}</div>
          </div>
          <!-- Moving dates -->
          <div style="font-size:14px;color:#555;">
            <div style="font-weight:700;color:#111;margin-bottom:10px;">Moving dates</div>
            <div>Packing:</div>
            <div>Uplift:</div>
            <div>Delivery:</div>
          </div>
        </div>
      </div>

      <!-- GraceCover -->
      <div style="background:#ffffff;padding:28px 24px;margin-bottom:50px;border:1px solid #e9e9e9;border-radius:20px;">
        <h3 style="font-size:22px;font-weight:700;font-style:italic;color:#cc0000;margin:0 0 0 0;padding-bottom:16px;border-bottom:1px solid #e0e0e0;">GraceCover</h3>
        <div style="font-size:14px;color:#555;line-height:1.7;margin-top:20px;">
          <p style="margin:0 0 14px 0;">Just as moving isn't a day-to-day occurrence, it needs more than just day to day cover. While Grace enjoys one of the lowest claim rates in the industry, we encourage the use of transit protection to ensure your peace of mind. We offer a range of options to best protect your belongings in transit and storage.</p>
          <p style="margin:0 0 14px 0;">We are pleased to offer you protection for your personal belongings in the form of our GraceCover Transit Protection program, which is underwritten and administered by Grace Removals, with additional coverage underwritten by AXA Corporate Solutions Marine.</p>
          <p style="margin:0 0 14px 0;">You can chose two different ways of arranging protection:</p>
          <p style="margin:0 0 14px 0;">You can either complete a Valued Inventory option which involves listing separately the full replacement value of your effects, or you can take the easy-to-use Lump Sum option of covering your shipment.</p>
          <p style="margin:0 0 14px 0;">Should you decide on the Lump Sum option the sum covered is determined by a calculation on the volume of your shipment. Each cubic meter is valued at USD$2750 and any specific items over USD$1500 are additional, on top of this. The premium is then worked out on this total.</p>
          <p style="margin:0;">We provide additional protection to both Valued Inventory and Lump Sum options. These additional covers can include mould and mildew, electrical and mechanical derangement and pairs and sets cover.</p>
        </div>
      </div>

      <!-- Pricing options - one card per costing -->
      {{#each costings}}
      <div style="margin-bottom:50px;border:1px solid #e9e9e9;border-radius:20px;overflow:hidden;">
        <!-- Red header: option name left, total price right -->
        <div style="background:#cc0000;color:#ffffff;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:16px;font-weight:700;">{{this.name}}</span>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:700;">\${{this.totalPrice}}</div>
            <div style="font-size:11px;font-weight:400;opacity:0.85;">Tax Included where applicable</div>
          </div>
        </div>
        <!-- Table -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#ffffff;">
          <thead>
            <tr style="background:#f5f5f5;border-bottom:1px solid #e9e9e9;">
              <th style="text-align:left;padding:12px 16px;font-weight:400;color:#888;">Moving Services</th>
              <th style="text-align:center;padding:12px 16px;font-weight:400;color:#888;width:110px;">Quantity</th>
              <th style="text-align:right;padding:12px 16px;font-weight:400;color:#888;width:120px;">Rate</th>
              <th style="text-align:right;padding:12px 16px;font-weight:700;color:#333;width:120px;">\${{this.totalPrice}}</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:14px 16px;font-weight:700;color:#222;">{{this.description}}</td>
              <td style="padding:14px 16px;text-align:center;color:#444;">{{this.quantity}}</td>
              <td style="padding:14px 16px;text-align:right;color:#444;">\${{this.rate}}</td>
              <td style="padding:14px 16px;text-align:right;font-weight:600;color:#cc0000;">\${{this.totalPrice}}</td>
            </tr>
          </tbody>
        </table>
        <!-- Summary + Select button -->
        <div style="padding:20px 20px 20px 20px;background:#ffffff;border-top:1px solid #e9e9e9;">
          <!-- Totals right-aligned -->
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:14px;padding-bottom:16px;border-bottom:1px solid #e0e0e0;margin-bottom:16px;">
            <div style="display:flex;gap:40px;">
              <span style="color:#888;">Ex Tax</span>
              <span style="color:#333;min-width:90px;text-align:right;">\${{this.rate}}</span>
            </div>
            <div style="display:flex;gap:40px;">
              <span style="color:#888;">Tax</span>
              <span style="color:#333;min-width:90px;text-align:right;">\$0.00</span>
            </div>
            <div style="display:flex;gap:40px;font-weight:700;font-size:15px;">
              <span style="color:#333;">Total</span>
              <span style="color:#cc0000;min-width:90px;text-align:right;">\${{this.totalPrice}}</span>
            </div>
            <div style="color:#888;font-size:12px;">Tax Included</div>
          </div>
          <!-- Select Option button – right aligned -->
          <div style="display:flex;justify-content:flex-end;">
            <button style="background:#cc0000;color:#fff;border:none;padding:12px 32px;font-size:14px;font-weight:700;border-radius:6px;cursor:pointer;">Select Option</button>
          </div>
        </div>
      </div>
      {{/each}}

      <!-- Accept quote section -->
      <style>
        /* Checkbox accent colour = company primary colour */
        #grace-terms-checkbox {
          accent-color: {{branding.primaryColor}};
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }
        /* Accept button – disabled state (before checkbox is ticked) */
        .grace-accept-btn {
          background: #f0f0f0;
          color: #aaa;
          border: none;
          padding: 14px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 6px;
          cursor: not-allowed;
          transition: background 0.2s, color 0.2s;
          width: 100%;
        }
        /* Accept button – enabled state (after checkbox is ticked) */
        #grace-terms-checkbox:checked ~ .grace-accept-row .grace-accept-btn {
          background: {{branding.primaryColor}};
          color: #ffffff;
          cursor: pointer;
        }
        #grace-terms-checkbox:checked ~ .grace-accept-row .grace-accept-btn:hover {
          opacity: 0.88;
        }
      </style>
      <div style="margin-bottom:50px;background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;padding:28px 24px;">
        <!-- Heading + grey rule -->
        <h3 style="color:{{branding.primaryColor}};font-size:22px;font-weight:700;margin:0 0 16px 0;padding-bottom:16px;border-bottom:1px solid #e0e0e0;">Accept quote</h3>

        <!-- Selected options summary -->
        <div style="margin-bottom:16px;font-size:13px;color:#333;">
          <div style="font-weight:700;margin-bottom:4px;">Selected Options (AUD)</div>
          <div style="color:#555;">Packing and removal charges: A\${{job.jobValue}}</div>
          <div style="color:#555;">Total: {{job.jobValue}}</div>
        </div>

        <!-- Intro paragraph -->
        <p style="font-size:13px;color:#777;line-height:1.7;margin:0 0 20px 0;">Please review the details of this proposal carefully to ensure everything is correct before accepting the quote for your move. By accepting the quote, you acknowledge and agree to the terms and conditions outlined at the bottom of this proposal. When you're ready, simply click "Accept." If you have any questions or notice anything unexpected, click the "Request Help" button, and a member of our team will get in touch with you as soon as possible.</p>

        <!-- Signature box -->
        <div style="border:1px solid #d1d5db;border-radius:6px;padding:40px 20px;background:#fafafa;margin-bottom:20px;position:relative;">
          <!-- Draw area -->
          <div style="height:100px;display:flex;align-items:center;justify-content:center;">
            <span style="font-family:'Brush Script MT',cursive;font-size:32px;color:#ccc;">Sign here</span>
          </div>
          <!-- Underline input -->
          <div style="border-top:1px solid #ccc;margin:20px 0 12px 0;padding-top:12px;">
            <input type="text" placeholder="Type signature" style="width:100%;border:none;border-bottom:1px solid #ccc;padding:8px 0;font-size:14px;color:#999;background:transparent;outline:none;" />
          </div>
          <!-- Clear button -->
          <button style="width:100%;background:#666;color:#fff;border:none;padding:12px;font-size:14px;font-weight:600;border-radius:4px;cursor:pointer;margin-top:4px;">Clear</button>
        </div>

        <!-- Terms link -->
        <div style="margin-bottom:12px;">
          <a href="#" style="color:{{branding.primaryColor}};font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
            Read Terms &amp; Conditions here
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        <!--
          IMPORTANT: The checkbox MUST come BEFORE the action buttons in the DOM
          so that the CSS general sibling selector (#grace-terms-checkbox:checked ~ .grace-accept-row)
          can toggle the Accept button state without JavaScript.
        -->
        <input type="checkbox" id="grace-terms-checkbox" />
        <label for="grace-terms-checkbox" style="display:flex;align-items:center;gap:10px;font-size:13px;color:#333;cursor:pointer;margin-bottom:24px;">
          <span>I have read and agree to the Terms &amp; Conditions</span>
        </label>

        <!-- Action buttons row (sibling of checkbox — required for CSS :checked ~ selector) -->
        <div class="grace-accept-row" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <button style="background:#555;color:#fff;border:none;padding:14px;font-size:14px;font-weight:700;border-radius:6px;cursor:pointer;">Request Help</button>
          <button class="grace-accept-btn">Accept</button>
        </div>
      </div>

      <!-- Included items / Inventory -->
      <div style="margin-bottom:32px;background:#ffffff;border:1px solid #e9e9e9;padding:24px;border-radius:20px;">
        <h3 style="color:#cc0000;font-size:22px;font-weight:700;margin:0 0 12px 0;">Included items</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;background:#fff;">
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

    <!-- Footer banner (full width, breaks out of container) -->
    <style>
      .grace-footer-img {
        width: 100%;
        height: auto;
        display: block;
        max-height: 550px;
        object-fit: cover;
        object-position: center;
      }
      @media (max-width: 1024px) {
        .grace-footer-img { max-height: 350px; }
      }
      @media (max-width: 640px) {
        .grace-footer-img { max-height: 200px; }
      }
    </style>
    <div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;overflow:hidden;">
      <img src="{{branding.footerImageUrl}}" alt="Grace Footer" class="grace-footer-img" onerror="this.src='/grace-assets/banner_3.png'" />
    </div>

  </div>

  <!-- Grey footer bar (full width) -->
  <div style="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;background:#2e3642;color:#ffffff;">
    <div style="max-width:980px;margin:0 auto;padding:24px 24px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;">
      <!-- Left: logo + copyright + powered by -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        <img src="{{branding.logoUrl}}" alt="{{branding.companyName}}" style="height:36px;width:auto;display:block;" onerror="this.style.display='none'" />
        <div style="font-size:11px;color:#aab0bb;line-height:1.6;">
          <div>&copy;2026, Grace Removals (Australia) Pty Ltd, All rights reserved.</div>
          <div>Powered by <a href="https://moveware.com" target="_blank" style="color:#cc0000;text-decoration:none;">Moveware</a></div>
        </div>
      </div>
      <!-- Right: address + contact (right aligned) -->
      <div style="text-align:right;font-size:11px;color:#aab0bb;line-height:1.8;">
        <div>11 Toohey Street</div>
        <div>Portsmith Qld</div>
        <div>+61 7 4035 1796</div>
        <div><a href="mailto:ops-cairns@grace.com.au" style="color:#cc0000;text-decoration:none;">ops-cairns@grace.com.au</a></div>
        <div>ABN: 35 083 330 223</div>
        <div style="color:#cc0000;">Grace Removals (Australia) Pty Ltd</div>
      </div>
    </div>
  </div>

</div>`,
    },
  ],
};
