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
  tags: Record<string, string>;
  image_url: string;
}

const EMPTY_ROW: ProductRow = {
  category: "",
  sub_category: "",
  name: "",
  size_spec: "",
  unit_price: "",
  price_unit: "",
  tags: {},
  image_url: "",
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
              category: (p.category as string) || "",
              sub_category: (p.sub_category as string) || "",
              name: (p.name as string) || "",
              size_spec: (p.size_spec as string) || "",
              unit_price: p.unit_price != null ? String(p.unit_price) : "",
              price_unit: (p.price_unit as string) || "",
              tags: (p.tags as Record<string, string>) || {},
              image_url: (p.image_url as string) || "",
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
    setRows((prev) => [...prev, { ...EMPTY_ROW, tags: {} }]);
  }

  function removeRow(index: number) {
    setRows((prev) => {
      if (prev.length <= 1) return [{ ...EMPTY_ROW, tags: {} }];
      return prev.filter((_, i) => i !== index);
    });
    onDirtyChange?.(true);
  }

  function updateTag(rowIdx: number, key: string, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], tags: { ...updated[rowIdx].tags, [key]: value } };
      return updated;
    });
    onDirtyChange?.(true);
  }

  function removeTag(rowIdx: number, key: string) {
    setRows((prev) => {
      const updated = [...prev];
      const newTags = { ...updated[rowIdx].tags };
      delete newTags[key];
      updated[rowIdx] = { ...updated[rowIdx], tags: newTags };
      return updated;
    });
    onDirtyChange?.(true);
  }

  function addTag(rowIdx: number) {
    const existing = Object.keys(rows[rowIdx].tags);
    let key = "";
    let i = 1;
    while (existing.includes(key)) key = `_new_${i++}`;
    updateTag(rowIdx, key, "");
  }

  function renameTag(rowIdx: number, oldKey: string, newKey: string) {
    if (!newKey.trim() || newKey === oldKey) return;
    setRows((prev) => {
      const updated = [...prev];
      const newTags = { ...updated[rowIdx].tags };
      const value = newTags[oldKey];
      delete newTags[oldKey];
      newTags[newKey.trim()] = value;
      updated[rowIdx] = { ...updated[rowIdx], tags: newTags };
      return updated;
    });
    onDirtyChange?.(true);
  }

  async function uploadProductImage(rowIdx: number, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("factory_id", factoryId);
    formData.append("bucket", "product-images");
    try {
      const res = await fetch("/api/upload/image", { method: "POST", body: formData });
      if (!res.ok) return;
      const { url } = await res.json();
      setRows((prev) => {
        const updated = [...prev];
        updated[rowIdx] = { ...updated[rowIdx], image_url: url };
        return updated;
      });
      onDirtyChange?.(true);
    } catch {
      // upload failed silently
    }
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
          tags: r.tags,
          image_url: r.image_url || null,
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
              <th className="text-left py-2 px-1 font-medium text-gray-600" colSpan={5}>
                Name, Size, Price & Details
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 align-top">
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
                <td className="py-1.5 px-1" colSpan={5}>
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      <input
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="e.g. Steel Angle Bar"
                        value={row.name}
                        onChange={(e) => updateRow(i, "name", e.target.value)}
                      />
                      <input
                        className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Size/Spec"
                        value={row.size_spec}
                        onChange={(e) => updateRow(i, "size_spec", e.target.value)}
                      />
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Price"
                        type="number"
                        value={row.unit_price}
                        onChange={(e) => updateRow(i, "unit_price", e.target.value)}
                      />
                      <input
                        className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                        placeholder="Unit"
                        value={row.price_unit}
                        onChange={(e) => updateRow(i, "price_unit", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium px-2"
                      >
                        Remove
                      </button>
                    </div>
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                      {Object.entries(row.tags).map(([key, value], tagIdx) => (
                        <span key={tagIdx} className="inline-flex items-center gap-0.5 bg-gray-100 border border-gray-200 rounded-full text-xs">
                          <input
                            className="w-16 bg-transparent px-2 py-0.5 text-xs font-medium text-gray-700 focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
                            placeholder="e.g. warranty"
                            value={key}
                            onChange={(e) => renameTag(i, key, e.target.value)}
                            onBlur={(e) => {
                              if (!e.target.value.trim()) removeTag(i, key);
                            }}
                          />
                          <span className="text-gray-400">:</span>
                          <input
                            className="w-20 bg-transparent px-1 py-0.5 text-xs text-gray-600 focus:outline-none placeholder:text-gray-400"
                            placeholder="e.g. 2 years"
                            value={value}
                            onChange={(e) => updateTag(i, key, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => removeTag(i, key)}
                            className="text-gray-400 hover:text-red-500 pr-1.5"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => addTag(i)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                        Add Tag
                      </button>
                    </div>
                    {/* Product image */}
                    <div className="flex items-center gap-2 pl-0.5">
                      {row.image_url ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={row.image_url}
                            alt={row.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(row.image_url, "_blank")}
                          />
                          <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Change
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadProductImage(i, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Add Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadProductImage(i, file);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
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
