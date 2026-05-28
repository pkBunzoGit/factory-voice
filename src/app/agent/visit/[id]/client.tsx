"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormProgress } from "@/components/forms/form-progress";
import {
  BusinessBasicsForm,
  CustomersForm,
  LeadTimeForm,
  ContactInfoForm,
} from "@/components/forms/section-forms";
import { ProductCatalogForm } from "@/components/forms/product-catalog-form";
import { ComboSolutionsForm } from "@/components/forms/combo-solutions-form";
import { LocationsForm } from "@/components/forms/locations-form";

const SECTION_KEYS = [
  "business_basics",
  "product_catalog",
  "combo_solutions",
  "customers",
  "lead_time",
  "contact_info",
  "locations",
];

const PROFILE_SECTION_FORMS: Record<
  string,
  React.ComponentType<{ data: Record<string, string>; onChange: (key: string, value: string) => void }>
> = {
  business_basics: BusinessBasicsForm,
  customers: CustomersForm,
  lead_time: LeadTimeForm,
  contact_info: ContactInfoForm,
};

export function VisitClient({ factoryId }: { factoryId: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/factory/${factoryId}/profile`);
        const data = await res.json();

        if (data.profiles) {
          const loaded: Record<string, Record<string, string>> = {};
          for (const p of data.profiles) {
            loaded[p.section] = p.data;
          }
          setSectionData(loaded);

          if (loaded.business_basics?.company_name) {
            setFactoryName(loaded.business_basics.company_name);
          }
        }
      } catch {
        // Will start with empty form
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [factoryId]);

  const currentSectionKey = SECTION_KEYS[currentStep];
  const currentData = sectionData[currentSectionKey] || {};

  const handleFieldChange = useCallback(
    (key: string, value: string) => {
      setSectionData((prev) => ({
        ...prev,
        [currentSectionKey]: {
          ...(prev[currentSectionKey] || {}),
          [key]: value,
        },
      }));
      setSaveStatus("");
    },
    [currentSectionKey]
  );

  const isStandaloneStep =
    currentSectionKey === "product_catalog" ||
    currentSectionKey === "combo_solutions" ||
    currentSectionKey === "locations";

  async function saveCurrentSection() {
    if (isStandaloneStep) return true;

    setSaving(true);
    setSaveStatus("");

    try {
      const res = await fetch(`/api/factory/${factoryId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: currentSectionKey,
          data: sectionData[currentSectionKey] || {},
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveStatus(`Error: ${err.error}`);
        return false;
      }

      setSaveStatus("Saved");
      return true;
    } catch {
      setSaveStatus("Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleNext() {
    const saved = await saveCurrentSection();
    if (saved && currentStep < SECTION_KEYS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSaveStatus("");
    } else if (saved && currentStep === SECTION_KEYS.length - 1) {
      router.push(`/agent/visit/${factoryId}/generate`);
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSaveStatus("");
    }
  }

  async function handleStepClick(step: number) {
    if (step !== currentStep) {
      await saveCurrentSection();
      setCurrentStep(step);
      setSaveStatus("");
    }
  }

  const ProfileForm = PROFILE_SECTION_FORMS[currentSectionKey];
  const isLastStep = currentStep === SECTION_KEYS.length - 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Loading factory data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              {factoryName || "Factory Visit"}
            </h1>
            <p className="text-xs text-gray-500">
              Step {currentStep + 1} of {SECTION_KEYS.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/agent/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <FormProgress
          currentStep={currentStep}
          onStepClick={handleStepClick}
        />

        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          {currentSectionKey === "product_catalog" ? (
            <ProductCatalogForm factoryId={factoryId} />
          ) : currentSectionKey === "combo_solutions" ? (
            <ComboSolutionsForm factoryId={factoryId} />
          ) : currentSectionKey === "locations" ? (
            <LocationsForm factoryId={factoryId} />
          ) : ProfileForm ? (
            <ProfileForm data={currentData} onChange={handleFieldChange} />
          ) : null}

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              {saveStatus && (
                <span
                  className={`text-xs ${saveStatus.startsWith("Error") || saveStatus === "Failed to save" ? "text-red-600" : "text-green-600"}`}
                >
                  {saveStatus}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              {!isStandaloneStep && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={saveCurrentSection}
                  loading={saving}
                >
                  Save
                </Button>
              )}
              <Button size="sm" onClick={handleNext} loading={saving}>
                {isLastStep ? "Generate Bot Profile" : "Next"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
