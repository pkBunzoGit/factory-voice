"use client";

const STEPS = [
  "Business Basics",
  "Products",
  "Pricing",
  "Customers",
  "Lead Time",
  "Contact Info",
];

export function FormProgress({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div className="flex gap-1 sm:gap-2 mb-8">
      {STEPS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onStepClick(i)}
          className={`flex-1 text-center py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            i === currentStep
              ? "bg-black text-white"
              : i < currentStep
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{i + 1}</span>
        </button>
      ))}
    </div>
  );
}
