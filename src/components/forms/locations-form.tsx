"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface LocationRow {
  name: string;
  city: string;
  area: string;
  phone: string;
  location_type: string;
}

const EMPTY_ROW: LocationRow = {
  name: "",
  city: "",
  area: "",
  phone: "",
  location_type: "distributor",
};

interface Props {
  factoryId: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function LocationsForm({ factoryId, onDirtyChange }: Props) {
  const [rows, setRows] = useState<LocationRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/factory/${factoryId}/locations`);
        const data = await res.json();
        if (data.locations && data.locations.length > 0) {
          setRows(
            data.locations.map((l: Record<string, unknown>) => ({
              name: (l.name as string) || "",
              city: (l.city as string) || "",
              area: (l.area as string) || "",
              phone: (l.phone as string) || "",
              location_type: (l.location_type as string) || "distributor",
            }))
          );
        }
      } catch {
        // start with empty row
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [factoryId]);

  const updateRow = useCallback(
    (index: number, field: keyof LocationRow, value: string) => {
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
      setSaveStatus("");
      onDirtyChange?.(true);
    },
    [onDirtyChange]
  );

  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) return [{ ...EMPTY_ROW }];
      return prev.filter((_, i) => i !== index);
    });
    onDirtyChange?.(true);
  }

  async function saveLocations() {
    setSaving(true);
    setSaveStatus("");
    try {
      const validRows = rows
        .filter((r) => r.name.trim() && r.city.trim())
        .map((r) => ({
          name: r.name.trim(),
          city: r.city.trim(),
          area: r.area.trim() || null,
          phone: r.phone.trim() || null,
          location_type: r.location_type || "distributor",
        }));

      const res = await fetch(`/api/factory/${factoryId}/locations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: validRows }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveStatus(`Error: ${err.error}`);
        return false;
      }

      setSaveStatus("Saved");
      onDirtyChange?.(false);
      return true;
    } catch {
      setSaveStatus("Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-sm py-8 text-center">
        Loading locations...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Distributor / Store Locations</h3>
          <p className="text-sm text-gray-500">
            Add distributor, store, or warehouse locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span
              className={`text-xs ${saveStatus.startsWith("Error") || saveStatus === "Failed to save" ? "text-red-600" : "text-green-600"}`}
            >
              {saveStatus}
            </span>
          )}
          <Button size="sm" variant="secondary" onClick={saveLocations} loading={saving}>
            Save Locations
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[22%]">
                Name*
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[18%]">
                City*
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[18%]">
                Area
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[16%]">
                Phone
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[16%]">
                Type
              </th>
              <th className="w-[10%]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. ABC Distributors"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Lusaka"
                    value={row.city}
                    onChange={(e) => updateRow(i, "city", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Industrial Area"
                    value={row.area}
                    onChange={(e) => updateRow(i, "area", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. +260..."
                    value={row.phone}
                    onChange={(e) => updateRow(i, "phone", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    value={row.location_type}
                    onChange={(e) => updateRow(i, "location_type", e.target.value)}
                  >
                    <option value="distributor">Distributor</option>
                    <option value="store">Store</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </td>
                <td className="py-1.5 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium px-2"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={addRow}>
        + Add Row
      </Button>
    </div>
  );
}

export { type LocationRow };
