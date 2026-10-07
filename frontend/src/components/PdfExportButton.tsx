"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import type { AnalyzeResponse } from "@/types/api";

interface PdfExportButtonProps {
  data: AnalyzeResponse;
  studentName?: string;
  parentName?: string;
}

export function PdfExportButton({
  data,
  studentName = "Student",
  parentName = "Parent",
}: PdfExportButtonProps) {
  const [exporting, setExporting] = React.useState(false);

  const formatRs = (amount: number) => {
    if (amount >= 10000000) {
      return `Rs. ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `Rs. ${(amount / 100000).toFixed(1)} Lakh`;
    }
    return `Rs. ${amount.toLocaleString("en-IN")}`;
  };

  const generatePdf = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("NEXTPATH - CAREER ROADMAP REPORT", 14, 20);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Multi-Stakeholder Psychometric & Financial Alignment Engine", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`, 14, 34);

      let yPos = 50;

      // Section 1: Family & Conflict Analysis
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("1. Family Profile & Conflict Analysis", 14, yPos);
      yPos += 7;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${studentName}  |  Parent: ${parentName}`, 14, yPos);
      yPos += 5;
      doc.text(
        `Parent-Student Conflict Index: ${data.conflict.index}/100 (${data.conflict.label.toUpperCase()} Friction)`,
        14,
        yPos
      );
      yPos += 5;

      if (data.conflict.topDisagreements && data.conflict.topDisagreements.length > 0) {
        doc.setFont("helvetica", "italic");
        doc.text("Top Divergence Drivers:", 14, yPos);
        yPos += 5;
        doc.setFont("helvetica", "normal");
        data.conflict.topDisagreements.forEach((d) => {
          doc.text(`• ${d.dimension.toUpperCase()}: ${d.text} (Gap: Δ ${d.gap}%)`, 18, yPos);
          yPos += 5;
        });
      }

      yPos += 4;

      // Section 2: Top Ranked Career Pathways (Numbered by current sorted position)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("2. Ranked Career Pathways", 14, yPos);
      yPos += 7;

      data.roadmap.slice(0, 5).forEach((career, index) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const position = index + 1;
        doc.text(
          `#${position} ${career.title || career.career} (${career.domain}) - Score: ${career.finalScore.toFixed(1)}/100`,
          14,
          yPos
        );
        yPos += 5;

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const examsStr =
          career.rawExams?.join(", ") ||
          career.exams.map((e) => e.name).join(", ") ||
          "Direct Admission / Merit";
        const collegesStr = career.colleges.map((c) => c.name).join("; ");
        doc.text(`Milestone Exams: ${examsStr}`, 18, yPos);
        yPos += 4;
        if (collegesStr) {
          doc.text(`Representative Institutions: ${collegesStr}`, 18, yPos);
          yPos += 4;
        }
        doc.text(`Path: ${career.timeline}`, 18, yPos);
        yPos += 6;
      });

      // Section 3: Financial Feasibility Breakdown (Uses Rs. to prevent character corruption)
      yPos += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("3. Financial Constraint Solver Breakdown", 14, yPos);
      yPos += 7;

      data.finance.slice(0, 5).forEach((f) => {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const costStr = formatRs(f.totalCost || f.totalCost4Year);
        const loanStr = f.loanNeeded > 0 ? formatRs(f.loanNeeded) : "Rs. 0";
        const salaryStr = `${formatRs(f.startingSalary || f.expectedStartingSalary)}/yr`;
        const status = f.viable ?? f.isViable ? "SOLVENT" : "EXCEEDS LIMITS";
        const breakeven = f.breakEvenYears?.toFixed(1) ?? "—";

        doc.text(
          `• ${f.careerName}: Cost ${costStr} | Loan: ${loanStr} | Starting CTC: ${salaryStr} | Break-Even: ${breakeven} yrs [${status}]`,
          14,
          yPos
        );
        yPos += 5;
      });

      // Section 4: Scholarships & Financial Aid
      yPos += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("4. Matched Scholarships & Financial Aid", 14, yPos);
      yPos += 7;

      const topScholarships = data.roadmap[0]?.scholarships || [];
      if (topScholarships.length > 0) {
        topScholarships.forEach((s) => {
          doc.setFontSize(8.5);
          doc.setFont("helvetica", "normal");
          doc.text(
            `• ${s.name} (${s.amount}) — Eligibility: ${s.matchedRule || s.eligibility} [Deadline: ${s.deadline}]`,
            14,
            yPos
          );
          yPos += 5;
        });
      } else {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text("• General state merit and central scholarship schemes applicable on board exam scores.", 14, yPos);
        yPos += 5;
      }

      // Footer
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "NextPath Engine — Validated via deterministic multi-vector scoring. All figures sourced from empirical benchmarks.",
        14,
        285
      );

      // Save PDF
      doc.save(`NextPath_Roadmap_${studentName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={generatePdf}
      disabled={exporting}
      id="export-pdf-button"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span>{exporting ? "Preparing…" : "Download PDF"}</span>
    </Button>
  );
}
