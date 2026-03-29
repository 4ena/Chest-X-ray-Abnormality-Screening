"use client";

import { User, Calendar, Eye, Activity } from "lucide-react";
import type { Patient } from "@/data/mock";

interface PatientInfoProps {
  patient: Patient;
}

export default function PatientInfo({ patient }: PatientInfoProps) {
  const items = [
    { icon: User, label: "Name", value: patient.name },
    { icon: Calendar, label: "Age / Sex", value: `${patient.age}y ${patient.sex}` },
    { icon: Calendar, label: "Admitted", value: patient.admissionDate },
    { icon: Eye, label: "View", value: `${patient.view} (${patient.apPa})` },
  ];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Patient Information</h3>
        <User size={16} className="text-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
            <p className="text-sm font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
