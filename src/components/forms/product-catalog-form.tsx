"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface ProductRow {
  category: string;
  sub_category: string;
  name: string;
  size_spec: string;
  unit_price: string;
  price_unit: string;
}

const EMPTY_ROW: ProductRow = {
  category: "",
  sub_category: "",
  name: "",
  size_spec: "",
  unit_price: "",
  price_unit: "",
};

interface Props {
  factoryId: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function ProductCatalogForm({ factoryId, onDirtyChange }: Props) {
  const [rows, setRows] = useState<ProductRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/factory/${factoryId}/products`);
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setRows(
            data.products.map((p: Record<string, unknown>) => ({
              category: p.category || "",
              sub_category: p.sub_category || "",
              name: p.name || "",
              size_spec: p.size_spec || "",
              unit_price: p.unit_price != null ? String(p.unit_price) : "",
              price_unit: p.price_unit || "",
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
    (index: number, field: keyof ProductRow, value: string) => {
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

  async function saveProducts() {
    setSaving(true);
    setSaveStatus("");
    try {
      const validRows = rows
        .filter((r) => r.category.trim() && r.name.trim())
        .map((r) => ({
          category: r.category.trim(),
          sub_category: r.sub_category.trim() || null,
          name: r.name.trim(),
          size_spec: r.size_spec.trim() || null,
          unit_price: r.unit_price ? parseFloat(r.unit_price) : null,
          price_unit: r.price_unit.trim() || null,
        }));

      const res = await fetch(`/api/factory/${factoryId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: validRows }),
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
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Catalog</h3>
          <p className="text-sm text-gray-500">
            Add all products with pricing details
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
          <Button size="sm" variant="secondary" onClick={saveProducts} loading={saving}>
            Save Products
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
        <table className="w-full text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[15%]">
                Category*
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[12%]">
                Sub-category
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[22%]">
                Product Name*
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[18%]">
                Size / Spec
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[12%]">
                Price
              </th>
              <th className="text-left py-2 px-1 font-medium text-gray-600 w-[12%]">
                Unit
              </th>
              <th className="w-[9%]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Pipes"
                    value={row.category}
                    onChange={(e) => updateRow(i, "category", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Heavy Duty"
                    value={row.sub_category}
                    onChange={(e) =>
                      updateRow(i, "sub_category", e.target.value)
                    }
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. Steel Angle Bar"
                    value={row.name}
                    onChange={(e) => updateRow(i, "name", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. 50mm, 2kg"
                    value={row.size_spec}
                    onChange={(e) => updateRow(i, "size_spec", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. 500"
                    type="number"
                    value={row.unit_price}
                    onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1">
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                    placeholder="e.g. per unit"
                    value={row.price_unit}
                    onChange={(e) => updateRow(i, "price_unit", e.target.value)}
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="text-red-400 hover:text-red-600 text-xs font-medium"
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

export { type ProductRow };
