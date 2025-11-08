// Enhanced PDF Report Generation Helper
// This file contains the comprehensive PDF generation logic

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Supplier } from "../services/api";

export interface ReportData {
  summary: {
    title: string;
    date: string;
    totalSuppliers: number;
    avgEthicalScore: number;
    avgCompositeScore: number;
    avgRiskFactor: number;
    avgCompletenessRatio: number;
    avgCO2Emissions: number;
    riskBreakdown: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  pillarAverages: {
    environmental: number;
    social: number;
    governance: number;
  } | null;
  suppliersByCountry: Record<string, number>;
  [key: string]: any;
}

// Helper function to format values
const formatValue = (value: any, decimals: number = 2): string => {
  if (value === null || value === undefined || value === "") return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return num.toFixed(decimals);
};

// Helper function to format percentage
const formatPercent = (value: any, decimals: number = 1): string => {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (Number.isNaN(num)) return "N/A";
  return `${(num * 100).toFixed(decimals)}%`;
};

// Helper function to add page header
const addPageHeader = (doc: jsPDF, title: string, pageNum: number, totalPages: number) => {
  doc.setFillColor(13, 15, 26);
  doc.rect(0, 0, 210, 297, "F");
  
  // Header bar
  doc.setFillColor(77, 91, 255);
  doc.rect(0, 0, 210, 15, "F");
  
  doc.setTextColor(224, 224, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 105, 10, { align: "center" });
  
  // Page number
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${pageNum} of ${totalPages}`, 195, 12, { align: "right" });
};

// Helper function to add page footer
const addPageFooter = (doc: jsPDF, year: number, pageNum: number, totalPages: number) => {
  // Footer separator
  doc.setDrawColor(77, 91, 255, 0.3);
  doc.line(20, 280, 190, 280);
  
  // Footer text
  doc.setTextColor(138, 148, 200);
  doc.setFontSize(8);
  doc.text(
    `ESG Performance Report ${year} | Generated with OptiSupply AI | Page ${pageNum} of ${totalPages}`,
    105,
    288,
    { align: "center" }
  );
};

// Generate comprehensive PDF report
export const generateComprehensivePDFReport = async (
  reportData: ReportData,
  allSuppliers: Supplier[],
  year: number
): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // ========== TITLE PAGE ==========
  doc.setFillColor(13, 15, 26);
  doc.rect(0, 0, 210, 297, "F");

  // Title
  doc.setTextColor(0, 240, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(reportData.summary.title, 105, 50, { align: "center" });

  doc.setTextColor(224, 224, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on: ${reportData.summary.date}`, 105, 65, { align: "center" });

  // Logo placeholder
  doc.setFillColor(77, 91, 255);
  doc.roundedRect(75, 90, 60, 60, 5, 5, "F");
  doc.setTextColor(13, 15, 26);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("OPTISUPPLY", 105, 120, { align: "center" });

  // Key metrics on title page
  doc.setTextColor(0, 240, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Key Metrics", 105, 170, { align: "center" });

  doc.setFillColor(25, 28, 43);
  doc.roundedRect(20, 180, 170, 80, 3, 3, "F");

  const metrics = [
    ["Total Suppliers", reportData.summary.totalSuppliers.toString()],
    ["Average ESG Score", `${Math.round(reportData.summary.avgEthicalScore)}%`],
    ["Average Composite Score", `${Math.round(reportData.summary.avgCompositeScore)}%`],
    ["Average CO₂ Emissions", `${formatValue(reportData.summary.avgCO2Emissions, 1)} tons`],
    ["Average Risk Factor", `${formatPercent(reportData.summary.avgRiskFactor)}`],
    ["Data Completeness", `${formatPercent(reportData.summary.avgCompletenessRatio)}`],
  ];

  let metricsYPos = 195;
  metrics.forEach(([label, value]) => {
    doc.setTextColor(138, 148, 200);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(label, 30, metricsYPos);
    doc.setTextColor(0, 240, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(value, 150, metricsYPos, { align: "right" });
    metricsYPos += 12;
  });

  addPageFooter(doc, year, 1, 0); // Will update total pages later

  // ========== EXECUTIVE SUMMARY ==========
  doc.addPage();
  addPageHeader(doc, "Executive Summary", 2, 0);

  doc.setTextColor(0, 240, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 105, 35, { align: "center" });

  doc.setTextColor(224, 224, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const summaryText = [
    "This comprehensive report provides a detailed analysis of your supply chain's ESG (Environmental, Social, and Governance) performance.",
    "The report includes complete supplier data, risk assessments, industry breakdowns, and actionable recommendations for improvement.",
    "All metrics are calculated using industry-standard methodologies and normalized for fair comparison across suppliers and industries.",
  ];
  let textY = 50;
  summaryText.forEach((text) => {
    const lines = doc.splitTextToSize(text, 170);
    lines.forEach((line: string) => {
      doc.text(line, 20, textY);
      textY += 6;
    });
    textY += 3;
  });

  // Risk Distribution
  doc.setTextColor(0, 240, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Risk Distribution", 105, textY + 10, { align: "center" });

  const riskData = [
    ["Risk Level", "Count", "Percentage"],
    [
      "Low Risk",
      (reportData.summary.riskBreakdown.low || 0).toString(),
      `${(((reportData.summary.riskBreakdown.low || 0) / reportData.summary.totalSuppliers) * 100).toFixed(1)}%`,
    ],
    [
      "Medium Risk",
      (reportData.summary.riskBreakdown.medium || 0).toString(),
      `${(((reportData.summary.riskBreakdown.medium || 0) / reportData.summary.totalSuppliers) * 100).toFixed(1)}%`,
    ],
    [
      "High Risk",
      (reportData.summary.riskBreakdown.high || 0).toString(),
      `${(((reportData.summary.riskBreakdown.high || 0) / reportData.summary.totalSuppliers) * 100).toFixed(1)}%`,
    ],
    [
      "Critical Risk",
      (reportData.summary.riskBreakdown.critical || 0).toString(),
      `${(((reportData.summary.riskBreakdown.critical || 0) / reportData.summary.totalSuppliers) * 100).toFixed(1)}%`,
    ],
  ];

      autoTable(doc, {
        head: [riskData[0]],
        body: riskData.slice(1),
        startY: textY + 20,
        styles: {
          font: "helvetica",
          fillColor: [25, 28, 43],
          textColor: [224, 224, 255],
          lineColor: [77, 91, 255],
          lineWidth: 0.2,
          fontSize: 10,
        },
        headStyles: {
          fillColor: [77, 91, 255],
          textColor: [224, 224, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [30, 33, 48],
        },
      } as any);

  addPageFooter(doc, year, 2, 0);

  // ========== PILLAR SCORES ==========
  doc.addPage();
  addPageHeader(doc, "ESG Pillar Analysis", 3, 0);

  doc.setTextColor(0, 240, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("ESG Pillar Scores", 105, 35, { align: "center" });

  if (reportData.pillarAverages) {
    const pillarLabels = ["Environmental", "Social", "Governance"];
    const pillarVals = [
      reportData.pillarAverages.environmental,
      reportData.pillarAverages.social,
      reportData.pillarAverages.governance,
    ];
    const pillarColors: [number, number, number][] = [
      [16, 185, 129], // Green
      [59, 130, 246], // Blue
      [139, 92, 246], // Purple
    ];

    let yPos = 50;
    pillarLabels.forEach((label, i) => {
      doc.setTextColor(224, 224, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${label}: ${formatValue(pillarVals[i], 1)}`, 30, yPos);

      // Progress bar
      doc.setFillColor(40, 44, 66);
      doc.roundedRect(30, yPos + 5, 150, 8, 2, 2, "F");
      const barWidth = Math.max(2, Math.min(150, (pillarVals[i] / 100) * 150));
      const c = pillarColors[i];
      doc.setFillColor(c[0], c[1], c[2]);
      doc.roundedRect(30, yPos + 5, barWidth, 8, 2, 2, "F");

      yPos += 25;
    });
  }

  addPageFooter(doc, year, 3, 0);

  // ========== SUPPLIER DETAILED LISTING ==========
  if (allSuppliers && allSuppliers.length > 0) {
    // Sort suppliers by final score (descending)
    const sortedSuppliers = [...allSuppliers].sort((a, b) => {
      const scoreA = (a as any).finalScore ?? a.composite_score ?? a.ethical_score ?? 0;
      const scoreB = (b as any).finalScore ?? b.composite_score ?? b.ethical_score ?? 0;
      return scoreB - scoreA;
    });

    // Split suppliers into pages (20 per page)
    const suppliersPerPage = 20;
    const totalSupplierPages = Math.ceil(sortedSuppliers.length / suppliersPerPage);

    for (let pageIdx = 0; pageIdx < totalSupplierPages; pageIdx++) {
      if (pageIdx > 0) doc.addPage();
      const pageNum = 4 + pageIdx;
      addPageHeader(doc, `Complete Supplier Listing (${pageIdx + 1}/${totalSupplierPages})`, pageNum, 0);

      const startIdx = pageIdx * suppliersPerPage;
      const endIdx = Math.min(startIdx + suppliersPerPage, sortedSuppliers.length);
      const pageSuppliers = sortedSuppliers.slice(startIdx, endIdx);

      // Comprehensive supplier table
      const supplierTableData = [
        [
          "Rank",
          "Name",
          "Country",
          "Industry",
          "Final Score",
          "E-Score",
          "S-Score",
          "G-Score",
          "Risk Level",
        ],
      ];

      pageSuppliers.forEach((supplier, idx) => {
        const rank = startIdx + idx + 1;
        const finalScore = formatValue((supplier as any).finalScore ?? supplier.composite_score ?? supplier.ethical_score ?? 0, 1);
        const envScore = formatValue(supplier.environmental_score ?? 0, 1);
        const socScore = formatValue(supplier.social_score ?? 0, 1);
        const govScore = formatValue(supplier.governance_score ?? 0, 1);
        const riskLevel = supplier.risk_level || "N/A";

        supplierTableData.push([
          rank.toString(),
          (supplier.name || "N/A").substring(0, 25),
          (supplier.country || "N/A").substring(0, 15),
          (supplier.industry || "N/A").substring(0, 20),
          finalScore,
          envScore,
          socScore,
          govScore,
          riskLevel,
        ]);
      });

      autoTable(doc, {
        head: [supplierTableData[0]],
        body: supplierTableData.slice(1),
        startY: 30,
        styles: {
          font: "helvetica",
          fillColor: [25, 28, 43],
          textColor: [224, 224, 255],
          lineColor: [77, 91, 255],
          lineWidth: 0.2,
          fontSize: 8,
        },
        headStyles: {
          fillColor: [77, 91, 255],
          textColor: [224, 224, 255],
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [30, 33, 48],
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 30 },
          4: { cellWidth: 20 },
          5: { cellWidth: 18 },
          6: { cellWidth: 18 },
          7: { cellWidth: 18 },
          8: { cellWidth: 20 },
        },
      } as any);

      addPageFooter(doc, year, pageNum, 0);
    }

    // ========== DETAILED SUPPLIER METRICS ==========
    // Create pages with full supplier details (5 suppliers per page)
    const detailsPerPage = 5;
    const totalDetailPages = Math.ceil(sortedSuppliers.length / detailsPerPage);

    for (let pageIdx = 0; pageIdx < totalDetailPages; pageIdx++) {
      doc.addPage();
      const pageNum = 4 + totalSupplierPages + pageIdx;
      addPageHeader(doc, `Detailed Supplier Metrics (${pageIdx + 1}/${totalDetailPages})`, pageNum, 0);

      const startIdx = pageIdx * detailsPerPage;
      const endIdx = Math.min(startIdx + detailsPerPage, sortedSuppliers.length);
      const detailSuppliers = sortedSuppliers.slice(startIdx, endIdx);

      let yPos = 35;
      detailSuppliers.forEach((supplier) => {
        // Supplier header
        doc.setFillColor(77, 91, 255, 0.3);
        doc.roundedRect(20, yPos - 5, 170, 50, 2, 2, "F");

        doc.setTextColor(0, 240, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(supplier.name || "N/A", 25, yPos);

        doc.setTextColor(138, 148, 200);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${supplier.country || "N/A"} | ${supplier.industry || "N/A"}`, 25, yPos + 6);

        // Key metrics
        const metrics = [
          ["Final Score", formatValue((supplier as any).finalScore ?? supplier.composite_score ?? supplier.ethical_score ?? 0, 1)],
          ["Environmental", formatValue(supplier.environmental_score ?? 0, 1)],
          ["Social", formatValue(supplier.social_score ?? 0, 1)],
          ["Governance", formatValue(supplier.governance_score ?? 0, 1)],
          ["Risk Penalty", formatValue(supplier.risk_penalty ?? 0, 1)],
          ["Risk Level", supplier.risk_level || "N/A"],
        ];

        let xPos = 25;
        metrics.forEach(([label, value]) => {
          doc.setTextColor(138, 148, 200);
          doc.setFontSize(8);
          doc.text(label, xPos, yPos + 15);
          doc.setTextColor(224, 224, 255);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text(value, xPos, yPos + 22);
          xPos += 28;
        });

        // Environmental metrics
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Environmental:", 25, yPos + 32);
        doc.setTextColor(224, 224, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const envMetrics = [
          `CO₂: ${formatValue(supplier.co2_emissions, 1)}t`,
          `Water: ${formatValue(supplier.water_usage, 1)}m³`,
          `Renewable: ${formatValue(supplier.renewable_energy_percent, 1)}%`,
        ];
        doc.text(envMetrics.join(" | "), 25, yPos + 38);

        // Social metrics
        doc.setTextColor(59, 130, 246);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Social:", 25, yPos + 45);
        doc.setTextColor(224, 224, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const socMetrics = [
          `Injury Rate: ${formatValue(supplier.injury_rate, 2)}`,
          `Training: ${formatValue(supplier.training_hours, 0)}h`,
          `Diversity: ${formatValue(supplier.gender_diversity_percent, 1)}%`,
        ];
        doc.text(socMetrics.join(" | "), 25, yPos + 51);

        yPos += 60;
        if (yPos > 250) {
          doc.addPage();
          const newPageNum = doc.getNumberOfPages();
          addPageHeader(doc, `Detailed Supplier Metrics (${pageIdx + 1}/${totalDetailPages})`, newPageNum, 0);
          yPos = 35;
        }
      });

      addPageFooter(doc, year, pageNum, 0);
    }
  }

  // ========== INDUSTRY BREAKDOWN ==========
  if (allSuppliers && allSuppliers.length > 0) {
    doc.addPage();
    const pageNum = doc.getNumberOfPages();
    addPageHeader(doc, "Industry Analysis", pageNum, 0);

    // Group suppliers by industry
    const industryMap = new Map<string, Supplier[]>();
    allSuppliers.forEach((s) => {
      const industry = s.industry || "Unknown";
      if (!industryMap.has(industry)) {
        industryMap.set(industry, []);
      }
      industryMap.get(industry)!.push(s);
    });

    const industryData = Array.from(industryMap.entries())
      .map(([industry, suppliers]) => {
        const avgFinal = suppliers.reduce((sum, s) => {
          const score = (s as any).finalScore ?? s.composite_score ?? s.ethical_score ?? 0;
          return sum + score;
        }, 0) / suppliers.length;
        const avgEnv = suppliers.reduce((sum, s) => sum + (s.environmental_score ?? 0), 0) / suppliers.length;
        const avgSoc = suppliers.reduce((sum, s) => sum + (s.social_score ?? 0), 0) / suppliers.length;
        const avgGov = suppliers.reduce((sum, s) => sum + (s.governance_score ?? 0), 0) / suppliers.length;
        const avgRisk = suppliers.reduce((sum, s) => sum + (s.risk_factor ?? 0), 0) / suppliers.length;

        return {
          industry,
          count: suppliers.length,
          avgFinal: avgFinal.toFixed(1),
          avgEnv: avgEnv.toFixed(1),
          avgSoc: avgSoc.toFixed(1),
          avgGov: avgGov.toFixed(1),
          avgRisk: (avgRisk * 100).toFixed(1) + "%",
        };
      })
      .sort((a, b) => b.count - a.count);

    const industryTableData = [
      ["Industry", "Count", "Avg Final", "Avg Env", "Avg Soc", "Avg Gov", "Avg Risk"],
      ...industryData.map((d) => [
        d.industry.substring(0, 25),
        d.count.toString(),
        d.avgFinal,
        d.avgEnv,
        d.avgSoc,
        d.avgGov,
        d.avgRisk,
      ]),
    ];

    autoTable(doc, {
      head: [industryTableData[0]],
      body: industryTableData.slice(1),
      startY: 30,
      styles: {
        font: "helvetica",
        fillColor: [25, 28, 43],
        textColor: [224, 224, 255],
        lineColor: [77, 91, 255],
        lineWidth: 0.2,
        fontSize: 9,
      },
      headStyles: {
        fillColor: [77, 91, 255],
        textColor: [224, 224, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [30, 33, 48],
      },
    } as any);

    addPageFooter(doc, year, pageNum, 0);
  }

  // ========== COUNTRY BREAKDOWN ==========
  if (allSuppliers && allSuppliers.length > 0) {
    doc.addPage();
    const pageNum = doc.getNumberOfPages();
    addPageHeader(doc, "Geographic Analysis", pageNum, 0);

    // Group suppliers by country
    const countryMap = new Map<string, Supplier[]>();
    allSuppliers.forEach((s) => {
      const country = s.country || "Unknown";
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country)!.push(s);
    });

    const countryData = Array.from(countryMap.entries())
      .map(([country, suppliers]) => {
        const avgFinal = suppliers.reduce((sum, s) => {
          const score = (s as any).finalScore ?? s.composite_score ?? s.ethical_score ?? 0;
          return sum + score;
        }, 0) / suppliers.length;
        const highRisk = suppliers.filter((s) => s.risk_level === "high" || s.risk_level === "critical").length;

        return {
          country,
          count: suppliers.length,
          avgFinal: avgFinal.toFixed(1),
          highRisk,
          highRiskPct: ((highRisk / suppliers.length) * 100).toFixed(1) + "%",
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 30); // Top 30 countries

    const countryTableData = [
      ["Country", "Suppliers", "Avg Final Score", "High Risk Count", "High Risk %"],
      ...countryData.map((d) => [
        d.country.substring(0, 25),
        d.count.toString(),
        d.avgFinal,
        d.highRisk.toString(),
        d.highRiskPct,
      ]),
    ];

    autoTable(doc, {
      head: [countryTableData[0]],
      body: countryTableData.slice(1),
      startY: 30,
      styles: {
        font: "helvetica",
        fillColor: [25, 28, 43],
        textColor: [224, 224, 255],
        lineColor: [77, 91, 255],
        lineWidth: 0.2,
        fontSize: 9,
      },
      headStyles: {
        fillColor: [77, 91, 255],
        textColor: [224, 224, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [30, 33, 48],
      },
    } as any);

    addPageFooter(doc, year, pageNum, 0);
  }

  // ========== RECOMMENDATIONS ==========
  doc.addPage();
  const pageNum = doc.getNumberOfPages();
  addPageHeader(doc, "Recommendations & Next Steps", pageNum, 0);

  doc.setTextColor(0, 255, 143);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Improvement Recommendations", 105, 35, { align: "center" });

  const recommendations = [
    "Implement supplier diversity program to improve social score",
    "Encourage top 10 carbon-emitting suppliers to set science-based targets",
    "Develop water conservation incentives for water-intensive industries",
    "Enhance supply chain transparency through blockchain tracking",
    "Establish regular ESG audits for high-risk suppliers",
    "Create incentive programs for suppliers improving their ESG scores",
    "Implement real-time monitoring for critical risk indicators",
    "Develop supplier training programs on ESG best practices",
  ];

  let recYPos = 50;
  recommendations.forEach((rec, idx) => {
    doc.setFillColor(0, 240, 255);
    doc.circle(25, recYPos - 3, 2, "F");
    doc.setTextColor(224, 224, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 160);
    lines.forEach((line: string) => {
      doc.text(line, 30, recYPos);
      recYPos += 5;
    });
    recYPos += 3;
  });

  addPageFooter(doc, year, pageNum, 0);

  // Update all page numbers with total count
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Update footer
    doc.setDrawColor(77, 91, 255, 0.3);
    doc.line(20, 280, 190, 280);
    doc.setTextColor(138, 148, 200);
    doc.setFontSize(8);
    doc.text(
      `ESG Performance Report ${year} | Generated with OptiSupply AI | Page ${i} of ${totalPages}`,
      105,
      288,
      { align: "center" }
    );
  }

  // Save the PDF
  doc.save(`OptiSupply_ESG_Report_${year}_${new Date().toISOString().split("T")[0]}.pdf`);
};

