import { forwardRef } from "react";
import { formatCurrency } from "../utils/format";

/**
 * All colors use hex/rgb only — html2canvas cannot parse Tailwind v4 oklab() in stylesheets.
 */
const receiptCss = `
.r-slip {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: min(186mm, 100%);
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(12px, 2.8vw, 13px);
  box-shadow: 0 18px 40px -14px rgba(15, 23, 42, 0.22);
  min-width: 0;
}
.r-slip-watermark {
  pointer-events: none;
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.r-slip-watermark span {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) rotate(-18deg);
  user-select: none;
  font-size: 86px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(5, 150, 105, 0.06);
}
.r-header {
  position: relative;
  text-align: center;
  padding: 22px 18px;
  color: #ffffff;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 52%, #0f172a 100%);
}
.r-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.35) 0%, transparent 55%);
  pointer-events: none;
}
.r-header-inner {
  position: relative;
}
.r-logo-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.r-logo-card {
  border-radius: 12px;
  background: #ffffff;
  padding: 8px 18px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.r-logo-card img {
  height: 40px;
  width: auto;
  max-width: 156px;
  object-fit: contain;
  display: block;
}
.r-fallback-logo {
  margin: 0 auto 10px;
  display: flex;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 17px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
}
.r-title {
  margin: 0;
  font-size: clamp(1.05rem, 4.2vw, 1.28rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.25;
  padding: 0 2px;
}
.r-subtitle {
  margin: 6px 0 0;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.38em;
  color: #c7d2fe;
}
.r-status-pill {
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  padding: 5px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.r-status-pill span:first-child {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #c7d2fe;
}
.r-status-badge {
  border-radius: 9999px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0f172a;
}
.r-status-badge.r-sb-success {
  background: rgba(52, 211, 153, 0.95);
  color: #0f172a;
}
.r-status-badge.r-sb-paid {
  background: rgba(52, 211, 153, 0.95);
  color: #0f172a;
}
.r-status-badge.r-sb-pending {
  background: #facc15;
  color: #422006;
}
.r-slip-watermark.r-wm-pending span {
  color: rgba(217, 119, 6, 0.11);
}
.r-cash-note {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 4px solid #d97706;
  font-size: 12px;
  line-height: 1.45;
  color: #92400e;
}
.r-footer-extra {
  margin-top: 8px;
  font-size: 11px;
  color: #64748b;
}
.r-body {
  position: relative;
  padding: 18px 18px 22px;
}
@media (min-width: 640px) {
  .r-header { padding-left: 28px; padding-right: 28px; }
  .r-body { padding-left: 28px; padding-right: 28px; }
}
.r-meta {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.95);
  padding: 12px 14px;
}
@media (min-width: 640px) {
  .r-meta {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
.r-meta-label {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #64748b;
}
.r-meta-id {
  margin: 3px 0 0;
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  overflow-wrap: anywhere;
  word-break: break-all;
}
.r-meta-date {
  margin: 3px 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1e293b;
}
.r-meta-right { text-align: left; }
@media (min-width: 640px) {
  .r-meta-right { text-align: right; }
}
.r-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  overflow: hidden;
}
.r-card + .r-card { margin-top: 14px; }
.r-card-head {
  border-bottom: 1px solid #f1f5f9;
  background: rgba(248, 250, 252, 0.95);
  padding: 8px 12px;
}
.r-card-head p {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: #64748b;
}
.r-card-body { padding: 0 12px; }
.r-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #f1f5f9;
  padding: 9px 0;
}
.r-row:last-child { border-bottom: none; }
@media (min-width: 640px) {
  .r-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
}
.r-row-label {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: #64748b;
}
.r-row-value {
  min-width: 0;
  max-width: 100%;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
  overflow-wrap: anywhere;
}
@media (min-width: 640px) {
  .r-row-value { text-align: right; }
}
.r-mono {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;
  color: #1e293b;
  overflow-wrap: anywhere;
  word-break: break-all;
}
.r-course {
  margin-top: 14px;
  border-radius: 10px;
  border: 1px solid #c7d2fe;
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 100%);
  padding: 14px 16px;
  box-shadow: 0 0 0 1px rgba(199, 210, 254, 0.6);
}
.r-course-label {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: #4f46e5;
}
.r-course-text {
  margin: 6px 0 0;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.35;
  color: #0f172a;
}
.r-amount {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  justify-content: space-between;
  border-radius: 10px;
  border: 2px solid rgba(15, 23, 42, 0.1);
  background: #0f172a;
  padding: 14px 16px;
  color: #ffffff;
}
@media (min-width: 640px) {
  .r-amount {
    flex-direction: row;
    align-items: center;
  }
}
.r-amount-label {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: #94a3b8;
}
.r-amount-sum {
  margin: 3px 0 0;
  font-size: clamp(1.25rem, 5vw, 1.6rem);
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: #ffffff;
  line-height: 1.15;
}
.r-amount-note {
  margin: 3px 0 0;
  font-size: 10px;
  color: #94a3b8;
}
.r-amount-divider {
  display: none;
  height: 40px;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
}
@media (min-width: 640px) {
  .r-amount-divider { display: block; }
}
.r-verify {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  text-align: center;
}
@media (min-width: 640px) {
  .r-verify { text-align: right; }
}
.r-verify p:first-child {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
}
.r-verify p:last-child {
  margin: 4px 0 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #6ee7b7;
}
.r-footer {
  margin-top: 22px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
  text-align: center;
}
.r-footer p:first-child {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
}
.r-footer p:last-child {
  margin: 6px 0 0;
  font-size: 10px;
  line-height: 1.55;
  color: #64748b;
}
/* —— Narrow phones —— */
@media screen and (max-width: 479px) {
  .r-slip {
    border-radius: 10px;
    font-size: 12px;
  }
  .r-slip-watermark span {
    font-size: 52px;
    letter-spacing: 0.12em;
  }
  .r-header {
    padding: 16px 12px;
  }
  .r-body {
    padding: 14px 12px 18px;
  }
  .r-title {
    font-size: 1.05rem;
  }
  .r-subtitle {
    letter-spacing: 0.22em;
    font-size: 9px;
  }
  .r-status-pill {
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
  }
  .r-meta {
    padding: 10px 12px;
  }
  .r-meta-id {
    font-size: 0.8125rem;
  }
  .r-meta-date {
    font-size: 0.75rem;
    line-height: 1.4;
  }
  .r-card-body {
    padding: 0 10px;
  }
  .r-row {
    padding: 8px 0;
  }
  .r-course {
    padding: 12px;
  }
  .r-course-text {
    font-size: 0.875rem;
  }
  .r-amount {
    padding: 12px;
  }
  .r-logo-card img {
    max-width: min(156px, 72vw);
  }
}

/* —— Small tablets / large phones landscape —— */
@media screen and (min-width: 480px) and (max-width: 767px) {
  .r-body {
    padding-left: 20px;
    padding-right: 20px;
  }
  .r-header {
    padding-left: 22px;
    padding-right: 22px;
  }
}

@media print {
  .r-slip {
    box-shadow: none;
    max-width: none;
    font-size: 13px;
  }
  .r-title {
    font-size: 1.28rem;
  }
  .r-amount-sum {
    font-size: 1.6rem;
  }
}
`;

const Row = ({ label, children }) => (
  <div className="r-row">
    <span className="r-row-label">{label}</span>
    <div className="r-row-value">{children}</div>
  </div>
);

const ReceiptTemplate = forwardRef(function ReceiptTemplate({ data }, ref) {
  const {
    companyName,
    logoUrl,
    receiptId,
    razorpayPaymentId,
    razorpayOrderId,
    displayDate,
    studentName,
    email,
    phone,
    courseServiceName,
    amountPaise,
    paymentMethodDisplay,
    paymentStatusLine,
    statusBadgeHeader,
    statusBadgeModifier,
    watermarkText,
    watermarkClass,
    showGatewayIds,
    verifyLine1,
    verifyLine2,
    offlineNote,
    amountFooterNote,
    footerExtra,
  } = data;

  const when = displayDate
    ? new Date(displayDate).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })
    : "—";

  return (
    <div ref={ref} className="receipt-slip-root r-slip">
      <style type="text/css">{receiptCss}</style>

      <div className={"r-slip-watermark " + (watermarkClass || "r-wm-paid")} aria-hidden>
        <span>{watermarkText}</span>
      </div>

      <div className="r-header">
        <div className="r-header-inner">
          {logoUrl ? (
            <div className="r-logo-wrap">
              <div className="r-logo-card">
                <img src={logoUrl} alt="" />
              </div>
            </div>
          ) : (
            <div className="r-fallback-logo">LH</div>
          )}
          <h1 className="r-title">{companyName}</h1>
          <p className="r-subtitle">Payment receipt</p>
          <div className="r-status-pill">
            <span>Status</span>
            <span className={"r-status-badge " + (statusBadgeModifier || "r-sb-success")}>{statusBadgeHeader}</span>
          </div>
        </div>
      </div>

      <div className="r-body">
        <div className="r-meta">
          <div>
            <p className="r-meta-label">Receipt ID</p>
            <p className="r-meta-id">{receiptId}</p>
          </div>
          <div className="r-meta-right">
            <p className="r-meta-label">Date &amp; time</p>
            <p className="r-meta-date">{when}</p>
          </div>
        </div>

        <div className="r-card">
          <div className="r-card-head">
            <p>Transaction details</p>
          </div>
          <div className="r-card-body">
            <Row label="Payment status">
              <span>{paymentStatusLine || "—"}</span>
            </Row>
            <Row label="Payment method">
              <span>{paymentMethodDisplay || "—"}</span>
            </Row>
            {showGatewayIds ? (
              <>
                <Row label="Razorpay payment ID">
                  <span className="r-mono">{razorpayPaymentId || "—"}</span>
                </Row>
                <Row label="Order ID">
                  <span className="r-mono">{razorpayOrderId || "—"}</span>
                </Row>
              </>
            ) : (
              <>
                <Row label="Razorpay payment ID">
                  <span className="r-mono">—</span>
                </Row>
                <Row label="Order ID">
                  <span className="r-mono">—</span>
                </Row>
              </>
            )}
          </div>
        </div>

        <div className="r-card">
          <div className="r-card-head">
            <p>Customer</p>
          </div>
          <div className="r-card-body">
            <Row label="Name">
              <span>{studentName || "—"}</span>
            </Row>
            <Row label="Email">
              <span className="r-mono" style={{ fontSize: "0.875rem" }}>
                {email || "—"}
              </span>
            </Row>
            <Row label="Phone">
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{phone || "—"}</span>
            </Row>
          </div>
        </div>

        <div className="r-course">
          <p className="r-course-label">Course / service</p>
          <p className="r-course-text">{courseServiceName || "—"}</p>
        </div>

        <div className="r-amount">
          <div>
            <p className="r-amount-label">Amount paid</p>
            <p className="r-amount-sum">{formatCurrency(amountPaise)}</p>
            <p className="r-amount-note">{amountFooterNote || "Inclusive of applicable taxes"}</p>
          </div>
          <div className="r-amount-divider" />
          <div className="r-verify">
            <p>{verifyLine1}</p>
            <p>{verifyLine2}</p>
          </div>
        </div>

        {offlineNote ? <div className="r-cash-note">{offlineNote}</div> : null}

        <footer className="r-footer">
          <p>Thank you for your payment</p>
          {footerExtra ? <p className="r-footer-extra">{footerExtra}</p> : null}
          <p>This is a computer-generated receipt and does not require a signature.</p>
        </footer>
      </div>
    </div>
  );
});

export default ReceiptTemplate;
