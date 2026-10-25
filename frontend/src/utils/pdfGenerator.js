import { jsPDF } from 'jspdf';

export function generateAwaazPDF(result) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // 180
  let y = 15;

  // Header Banner
  doc.setFillColor(30, 27, 75); // Dark Purple / Slate
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AWAAZ', margin + 6, y + 9);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Victim Incident Response & Complaint Assistance', margin + 34, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('AI-Assisted Cyber Fraud Complaint Draft', margin + 6, y + 18);

  y += 30;

  // Metadata Box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 225, 230);
  doc.rect(margin, y, contentWidth, 18, 'FD');

  doc.setTextColor(50, 60, 70);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`GENERATED DATE: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, margin + 4, y + 6);
  doc.text(`INCIDENT CLASSIFICATION: ${(result.fraud_type || 'Financial Cyber Fraud').toUpperCase()}`, margin + 4, y + 12);
  doc.text(`CONFIDENCE: ${result.confidence_percentage || '95%'}`, pageWidth - margin - 35, y + 6);

  y += 24;

  const addSectionHeader = (title) => {
    if (y > 260) {
      doc.addPage();
      y = 15;
    }
    doc.setFillColor(79, 70, 229); // Purple Primary Accent
    doc.rect(margin, y, 3, 6, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 6, y + 4.5);
    y += 8;
  };

  // 1. COMPLAINANT INCIDENT STATEMENT
  addSectionHeader('1. COMPLAINANT INCIDENT STATEMENT');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 80);

  const stmtLines = doc.splitTextToSize(`"${result.incident_description || 'No statement provided.'}"`, contentWidth - 4);
  doc.text(stmtLines, margin + 2, y);
  y += (stmtLines.length * 4.5) + 6;

  // 2. INCIDENT DETAILS TABLE
  addSectionHeader('2. INCIDENT DETAILS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const detailsTable = [
    ['Incident Type:', 'Cybercrime Complaint / Incident Assistance'],
    ['Fraud Category:', result.fraud_type || 'Not provided by the complainant.'],
    ['Incident Date:', result.incident_date || 'Not provided by the complainant.'],
    ['Incident Time:', result.incident_time || 'Not provided by the complainant.'],
    ['Communication Channel:', result.communication_channel || 'Not provided by the complainant.'],
    ['Payment Method:', result.payment_mode || 'Not provided by the complainant.'],
    ['Target Bank / Institution:', result.bank_name || 'Not provided by the complainant.'],
    ['Amount Disputed / Lost:', result.extracted_amount || 'Not provided by the complainant.'],
    ['Transaction ID / UTR:', result.transaction_id || 'Not provided by the complainant.'],
    ['Suspect UPI VPA:', result.upi_id || 'Not provided by the complainant.'],
    ['Suspect Phone Number:', result.suspect_phone || 'Not provided by the complainant.'],
    ['Suspect Account Number:', result.suspect_account || 'Not provided by the complainant.'],
    ['Suspicious Link / URL:', result.suspicious_url || 'Not provided by the complainant.']
  ];

  detailsTable.forEach(([label, val], idx) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    const bgFill = (idx % 2 === 0) ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...bgFill);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 3, y + 3.8);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val), margin + 55, y + 3.8);
    y += 5.5;
  });

  y += 6;

  // 3. FORMAL COMPLAINT LETTER
  addSectionHeader('3. FORMAL COMPLAINT DRAFT');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const letterText = result.complaint_letter || 'Draft complaint letter unavailable.';
  const letterLines = doc.splitTextToSize(letterText, contentWidth - 4);

  letterLines.forEach(line => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text(line, margin + 2, y);
    y += 4.5;
  });

  // Footer Disclaimer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MuleNet AI Response Engine • Confidential Victim Complaint Report • Call 1930 / cybercrime.gov.in',
      margin,
      288
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, 288);
  }

  doc.save(`Awaaz_Cybercrime_Complaint_${(result.fraud_type || 'Fraud').replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}

export function generateInvestigationReportPDF(reportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // 180
  let y = 15;

  // Header Banner
  doc.setFillColor(11, 15, 25); // Dark Navy Blue
  doc.rect(margin, y, contentWidth, 26, 'F');

  doc.setTextColor(6, 182, 212); // Cyan Accent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MULENET AI', margin + 6, y + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('MULE ACCOUNT FRAUD INVESTIGATION REPORT', margin + 48, y + 9);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('CONFIDENTIAL • FOR AUTHORIZED COMPLIANCE & CYBER CRIME INVESTIGATION USE', margin + 6, y + 19);

  y += 32;

  // Metadata Header Bar
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 18, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORT ID: ${reportData.report_id || 'REP-20260821-001'}`, margin + 4, y + 6);
  doc.text(`GENERATED: ${reportData.generation_timestamp || new Date().toLocaleString()}`, margin + 4, y + 12);
  doc.text(`ACCOUNT ID: ${reportData.account_id || 'N/A'}`, margin + 95, y + 6);
  doc.text(`MODE: ${reportData.metadata?.mode || 'ML MODE'}`, margin + 95, y + 12);

  y += 24;

  const addSectionHeader = (title) => {
    if (y > 260) {
      doc.addPage();
      y = 15;
    }
    doc.setFillColor(6, 182, 212); // Cyan Accent Bar
    doc.rect(margin, y, 3, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 6, y + 4.5);
    y += 8;
  };

  // 1. EXECUTIVE SUMMARY
  addSectionHeader('1. EXECUTIVE SUMMARY');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const execLines = doc.splitTextToSize(reportData.executive_summary || 'Executive summary unavailable.', contentWidth - 4);
  doc.text(execLines, margin + 2, y);
  y += (execLines.length * 4.5) + 6;

  // 2. RISK ASSESSMENT
  addSectionHeader('2. PREDICTIVE RISK ASSESSMENT');
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 20, 'F');

  const rScore = reportData.risk_score || 0;
  const rLevel = reportData.risk_level || 'LOW';
  const prob = (reportData.model_probability !== undefined) ? (reportData.model_probability * 100).toFixed(1) : 'N/A';
  const anomaly = reportData.anomaly_score || 'N/A';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text(`Risk Score: ${rScore} / 100`, margin + 6, y + 7);
  doc.text(`Risk Level: ${rLevel}`, margin + 6, y + 14);

  doc.text(`Mule Probability: ${prob}%`, margin + 95, y + 7);
  doc.text(`Anomaly Score: ${anomaly} / 100`, margin + 95, y + 14);

  y += 26;

  // 3. TOP RISK CONTRIBUTING FEATURES (SHAP)
  addSectionHeader('3. MODEL EXPLAINABILITY & SHAP ANALYSIS');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  const shapItems = reportData.top_risk_features || [];
  if (shapItems.length > 0) {
    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('FEATURE NAME', margin + 3, y + 4.2);
    doc.text('ACTUAL VAL', margin + 75, y + 4.2);
    doc.text('SHAP IMPACT', margin + 115, y + 4.2);
    doc.text('EFFECT', margin + 145, y + 4.2);
    y += 6;

    shapItems.forEach((item, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      const bgFill = (idx % 2 === 0) ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...bgFill);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(String(item.feature_name || item.feature_id), margin + 3, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.text(String(item.actual_value), margin + 75, y + 3.8);

      const shapVal = Number(item.shap_impact || item.shap_value || 0);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(shapVal > 0 ? 220 : 16, shapVal > 0 ? 38 : 185, shapVal > 0 ? 38 : 129);
      doc.text(shapVal > 0 ? `+${shapVal.toFixed(3)}` : shapVal.toFixed(3), margin + 115, y + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(String(item.effect || (shapVal > 0 ? 'Increases Risk' : 'Decreases Risk')), margin + 145, y + 3.8);
      y += 5.5;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Feature-level explanation is unavailable for this model prediction.', margin + 2, y);
    y += 6;
  }

  y += 6;

  // 4. ACCOUNT BEHAVIORAL PROFILE
  addSectionHeader('4. ACCOUNT BEHAVIORAL PROFILE');
  const profile = reportData.behavioral_profile || {};
  const profileTable = [
    ['Average Balance (14D):', profile.avg_balance_14d !== undefined ? `Rs. ${profile.avg_balance_14d.toLocaleString()}` : 'N/A'],
    ['Account Tenure (Days):', profile.tenure_days !== undefined ? `${profile.tenure_days} Days` : 'N/A'],
    ['UPI Minimum Txns (7D):', profile.upi_min_txns_7d !== undefined ? String(profile.upi_min_txns_7d) : 'N/A'],
    ['Cash Debits (14D):', profile.cash_debit_txns_14d !== undefined ? String(profile.cash_debit_txns_14d) : 'N/A'],
    ['Net Banking Debits (14D):', profile.net_banking_debit_14d !== undefined ? String(profile.net_banking_debit_14d) : 'N/A'],
    ['Customer Age:', profile.customer_age !== undefined ? `${profile.customer_age} Yrs` : 'N/A']
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  profileTable.forEach(([label, val], idx) => {
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    const bgFill = (idx % 2 === 0) ? [248, 250, 252] : [255, 255, 255];
    doc.setFillColor(...bgFill);
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 3, y + 3.8);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val), margin + 80, y + 3.8);
    y += 5.5;
  });

  y += 6;

  // 5. NETWORK INTELLIGENCE
  addSectionHeader('5. NETWORK INTELLIGENCE & GRAPH TOPOLOGY');
  const net = reportData.network_intelligence || {};
  if (net.has_network) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const netTable = [
      ['Primary Topology Pattern:', net.primary_topology || 'REGULAR'],
      ['In-Degree / Out-Degree:', `${net.in_degree || 0} In / ${net.out_degree || 0} Out`],
      ['PageRank Centrality:', String(net.pagerank || 0.0)],
      ['Connected Accounts:', `${net.connected_accounts_count || 0} Accounts`],
      ['Incoming Volume Flow:', `Rs. ${(net.incoming_amount || 0).toLocaleString()}`],
      ['Outgoing Volume Flow:', `Rs. ${(net.outgoing_amount || 0).toLocaleString()}`]
    ];
    netTable.forEach(([label, val], idx) => {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      const bgFill = (idx % 2 === 0) ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...bgFill);
      doc.rect(margin, y, contentWidth, 5.5, 'F');
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin + 3, y + 3.8);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
      doc.text(String(val), margin + 80, y + 3.8);
      y += 5.5;
    });

    if (net.topology_explanation) {
      y += 2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const explLines = doc.splitTextToSize(`Topology Analysis: ${net.topology_explanation}`, contentWidth - 4);
      doc.text(explLines, margin + 2, y);
      y += (explLines.length * 4) + 4;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No significant network relationship data available.', margin + 2, y);
    y += 6;
  }

  y += 4;

  // 6. RECOMMENDED ACTION & RISK INTERPRETATION
  addSectionHeader('6. RISK INTERPRETATION & RECOMMENDED ACTION');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(220, 38, 38);
  doc.text(`ACTION REQUIRED: ${reportData.recommended_action || 'NO IMMEDIATE ACTION REQUIRED'}`, margin + 2, y + 4);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const interpLines = doc.splitTextToSize(reportData.risk_interpretation || 'Standard monitoring recommended.', contentWidth - 4);
  doc.text(interpLines, margin + 2, y);
  y += (interpLines.length * 4.5) + 6;

  // Footer Disclaimer
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MuleNet AI Decision-Support System • Confidential Fraud Investigation Report • Authorized Compliance Use Only',
      margin,
      288
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 15, 288);
  }

  doc.save(`MuleNet_Investigation_Report_${reportData.account_id || 'Account'}_${Date.now()}.pdf`);
}
