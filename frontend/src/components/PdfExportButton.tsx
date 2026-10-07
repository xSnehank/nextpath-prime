"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
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

  const generatePdf = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("PRISM ENGINE - CAREER ROADMAP REPORT", 14, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Multi-Stakeholder Psychometric & Financial Alignment (DataQuest 3.0)", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}`, 14, 34);

      let yPos = 52;

      // Section: Family & Alignment Overview
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("1. Family Profile & Conflict Analysis", 14, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Student: ${studentName}  |  Parent: ${parentName}`, 14, yPos);
      yPos += 6;
      doc.text(
        `Parent-Student Conflict Index: ${data.conflict.index}/100 (${data.conflict.label.toUpperCase()} Friction)`,
        14,
        yPos
      );
      yPos += 6;

      doc.setFont("helvetica", "italic");
      doc.text("Top Divergence Areas:", 14, yPos);
      yPos += 5;
      data.conflict.topDisagreements.forEach((d) => {
        doc.text(`• ${d.area}: Student ${d.studentValue}% vs Parent ${d.parentValue}% (Gap: Δ ${d.gap})`, 18, yPos);
        yPos += 5;
      });

      yPos += 6;

      // Section: Top Ranked Careers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("2. Top Ranked Career Pathways", 14, yPos);
      yPos += 8;

      data.roadmap.slice(0, 4).forEach((career) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(
          `#${career.rank} ${career.title} (${career.domain}) - Score: ${career.finalScore.toFixed(1)}/100`,
          14,
          yPos
        );
        yPos += 5;

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const examsStr = career.exams.map((e) => e.name).join(", ");
        const collegesStr = career.colleges.map((c) => `${c.name} (${c.location})`).join("; ");
        doc.text(`Exams: ${examsStr || "Merit Based"}`, 18, yPos);
        yPos += 4;
        doc.text(`Institutions: ${collegesStr}`, 18, yPos);
        yPos += 4;
        doc.text(`Timeline: ${career.timeline}`, 18, yPos);
        yPos += 6;
      });

      // Section: Financial Analysis
      yPos += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("3. Financial Constraint Solver Breakdown", 14, yPos);
      yPos += 8;

      data.finance.slice(0, 4).forEach((f) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const costStr = `₹${(f.totalCost4Year / 100000).toFixed(1)}L`;
        const salaryStr = `₹${(f.expectedStartingSalary / 100000).toFixed(1)}L/yr`;
        const status = f.isViable ? "AFFORDABLE" : "OVER BUDGET";
        doc.text(
          `• ${f.careerName}: Cost ${costStr} | Loan: ₹${(f.loanNeeded / 100000).toFixed(1)}L | Salary: ${salaryStr} | Break-Even: ${f.breakEvenYears} yrs [${status}]`,
          14,
          yPos
        );
        yPos += 5;
      });

      // Section: Scholarships
      yPos += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("4. Matched Scholarships & Financial Aid", 14, yPos);
      yPos += 8;

      const topScholarships = data.roadmap[0]?.scholarships || [];
      topScholarships.forEach((s) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${s.name} (${s.amount}) - Eligibility: ${s.eligibility} [Deadline: ${s.deadline}]`, 14, yPos);
        yPos += 5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "PRISM Engine — Validated via deterministic multi-vector scoring. For official guidance only.",
        14,
        285
      );

      // Save PDF
      doc.save(`PRISM_Career_Roadmap_${studentName.replace(/\s+/g, "_")}.pdf`);
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
      className="flex items-center gap-2 border-white/20 text-slate-200 hover:text-white"
      id="export-pdf-button"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
      ) : (
        <Download className="h-4 w-4 text-cyan-400" />
      )}
      <span>{exporting ? "Generating PDF..." : "Export PDF Summary"}</span>
    </Button>
  );
}
