"use client";

import { MoreHorizontal, Phone, Mail, Calendar, User, Eye, FileText } from "lucide-react";
import type { Patient } from "@/data/mock";

interface PatientProfileProps {
  patient: Patient;
}

export default function PatientProfile({ patient }: PatientProfileProps) {
  const initials = patient.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const riskColor =
    patient.riskLevel === "High" ? "text-critical bg-critical-bg" :
    patient.riskLevel === "Medium" ? "text-moderate bg-moderate-bg" : "text-normal bg-normal-bg";

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
            {initials}
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-foreground leading-tight">
              {patient.name}
            </h2>
            <p className="text-xs text-muted mt-0.5">Patient #{String(patient.id).padStart(5, "0")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor}`}>
            {patient.riskLevel}
          </span>
          <button className="text-muted hover:text-foreground p-1">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Contact */}
      <div className="flex items-center gap-4 text-xs text-muted mb-4 pb-4 border-b border-border">
        <span className="flex items-center gap-1.5">
          <Phone size={12} />
          (513) 555-0{patient.id}42
        </span>
        <span className="flex items-center gap-1.5">
          <Mail size={12} />
          {patient.name.split(" ")[0].toLowerCase()}@email.com
        </span>
      </div>

      {/* Info grid */}
      <div className="mb-4">
        <p className="text-[11px] text-muted font-medium mb-2.5">Info</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-muted">Age</p>
            <p className="text-sm font-semibold text-foreground">{patient.age} years</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">Gender</p>
            <p className="text-sm font-semibold text-foreground">{patient.sex}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted">View</p>
            <p className="text-sm font-semibold text-foreground">{patient.apPa}</p>
          </div>
        </div>
      </div>

      {/* Additional details */}
      <div className="space-y-2.5 mb-4 pb-4 border-b border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5"><Calendar size={12} /> Admitted</span>
          <span className="font-medium text-foreground">{patient.admissionDate}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5"><Eye size={12} /> Imaging</span>
          <span className="font-medium text-foreground">{patient.view} ({patient.apPa})</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1.5"><User size={12} /> Referring</span>
          <span className="font-medium text-foreground">Dr. Williams</span>
        </div>
      </div>

      {/* Medical history (inspired by DocPort) */}
      <div>
        <p className="text-[11px] text-muted font-medium mb-2.5 flex items-center gap-1.5">
          <FileText size={11} /> Medical History
        </p>
        <div className="space-y-2">
          <div className="bg-panel-bg rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted">Primary Concern</p>
            <p className="text-xs font-medium text-foreground">{patient.topFinding}</p>
          </div>
          <div className="bg-panel-bg rounded-lg px-3 py-2">
            <p className="text-[10px] text-muted">Findings Detected</p>
            <p className="text-xs font-medium text-foreground">
              {patient.findings.length} abnormalit{patient.findings.length === 1 ? "y" : "ies"} flagged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
