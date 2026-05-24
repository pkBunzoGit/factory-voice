"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ComboItem } from "@/lib/types";

interface ComboData {
  id?: string;
  name: string;
  tags: Record<string, string>;
  items: ComboItem[];
  grand_total: string;
  image_url: string;
}

interface Props {
  factoryId: string;
}

export function ComboSolutionsForm({ factoryId }: Props) {
  const [combos, setCombos] = useState<ComboData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadCombos();
  }, [factoryId]);

  async function loadCombos() {
    try {
      const res = await fetch(`/api/factory/${factoryId}/combos`);
      const data = await res.json();
      if (data.combos) {
        setCombos(
          data.combos.map((c: Record<string, unknown>) => ({
            id: c.id,
            name: (c.name as string) || "",
            tags: (c.tags as Record<string, string>) || {},
            items: (c.items as ComboItem[]) || [],
            grand_total: c.grand_total != null ? String(c.grand_total) : "",
            image_url: (c.image_url as string) || "",
          }))
        );
      }
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setExtracting(false);
    setStatus("Uploading image...");

    try {
      // Upload file to Supabase Storage
      const formData = new FormData();
      formData.append("file", file);
      formData.append("factory_id", factoryId);

      const uploadRes = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        setStatus(`Upload failed: ${err.error}`);
        setUploading(false);
        return;
      }

      const { url } = await uploadRes.json();
      setUploading(false);
      setExtracting(true);
      setStatus("Extracting data from image with AI...");

      // Convert file to base64 for Claude Vision
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const extractRes = await fetch(
            `/api/factory/${factoryId}/combos/extract`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                image_base64: base64,
                media_type: file.type,
              }),
            }
          );

          if (!extractRes.ok) {
            const err = await extractRes.json();
            setStatus(`Extraction failed: ${err.error}`);
            setExtracting(false);
            return;
          }

          const { extracted } = await extractRes.json();

          const newCombo: ComboData = {
            name: extracted.package_name || "Untitled Package",
            tags: extracted.tags || {},
            items: extracted.items || [],
            grand_total: extracted.grand_total
              ? String(extracted.grand_total)
              : "",
            image_url: url,
          };

          setCombos((prev) => [...prev, newCombo]);
          setEditingIndex(combos.length);
          setStatus("Data extracted! Review and confirm below.");
          setExtracting(false);
        } catch {
          setStatus("Extraction failed");
          setExtracting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setStatus("Upload failed");
      setUploading(false);
    }

    e.target.value = "";
  }

  async function saveCombo(index: number) {
    const combo = combos[index];
    setSavingId(index);
    setStatus("");

    try {
      const payload = {
        name: combo.name,
        tags: combo.tags || {},
        items: combo.items,
        grand_total: combo.grand_total ? parseFloat(combo.grand_total) : null,
        image_url: combo.image_url || null,
      };

      if (combo.id) {
        // Delete and re-create for simplicity
        await fetch(
          `/api/factory/${factoryId}/combos?combo_id=${combo.id}`,
          { method: "DELETE" }
        );
      }

      const res = await fetch(`/api/factory/${factoryId}/combos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setStatus(`Error: ${err.error}`);
        return;
      }

      const { combo: saved } = await res.json();
      setCombos((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          id: saved.id,
        };
        return updated;
      });

      setEditingIndex(null);
      setStatus("Combo saved!");
    } catch {
      setStatus("Failed to save combo");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCombo(index: number) {
    const combo = combos[index];
    if (combo.id) {
      await fetch(
        `/api/factory/${factoryId}/combos?combo_id=${combo.id}`,
        { method: "DELETE" }
      );
    }
    setCombos((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    setStatus("Combo removed");
  }

  function updateComboField(
    index: number,
    field: keyof Omit<ComboData, "items" | "id" | "tags">,
    value: string
  ) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateTag(comboIndex: number, key: string, value: string) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[comboIndex] = {
        ...updated[comboIndex],
        tags: { ...updated[comboIndex].tags, [key]: value },
      };
      return updated;
    });
  }

  function renameTag(comboIndex: number, oldKey: string, newKey: string) {
    if (!newKey.trim() || oldKey === newKey) return;
    setCombos((prev) => {
      const updated = [...prev];
      const tags = { ...updated[comboIndex].tags };
      const val = tags[oldKey];
      delete tags[oldKey];
      tags[newKey.trim()] = val;
      updated[comboIndex] = { ...updated[comboIndex], tags };
      return updated;
    });
  }

  function removeTag(comboIndex: number, key: string) {
    setCombos((prev) => {
      const updated = [...prev];
      const tags = { ...updated[comboIndex].tags };
      delete tags[key];
      updated[comboIndex] = { ...updated[comboIndex], tags };
      return updated;
    });
  }

  function addTag(comboIndex: number) {
    const existing = Object.keys(combos[comboIndex].tags);
    let key = "detail";
    let i = 1;
    while (existing.includes(key)) {
      key = `detail_${i++}`;
    }
    updateTag(comboIndex, key, "");
  }

  function updateItem(
    comboIndex: number,
    itemIndex: number,
    field: keyof ComboItem,
    value: string
  ) {
    setCombos((prev) => {
      const updated = [...prev];
      const items = [...updated[comboIndex].items];
      items[itemIndex] = {
        ...items[itemIndex],
        [field]: field === "name" ? value : parseFloat(value) || 0,
      };
      if (field === "qty" || field === "unit_price") {
        items[itemIndex].total = items[itemIndex].qty * items[itemIndex].unit_price;
      }
      updated[comboIndex] = { ...updated[comboIndex], items };
      return updated;
    });
  }

  function addItem(comboIndex: number) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[comboIndex] = {
        ...updated[comboIndex],
        items: [
          ...updated[comboIndex].items,
          { name: "", qty: 0, unit_price: 0, total: 0 },
        ],
      };
      return updated;
    });
  }

  function removeItem(comboIndex: number, itemIndex: number) {
    setCombos((prev) => {
      const updated = [...prev];
      updated[comboIndex] = {
        ...updated[comboIndex],
        items: updated[comboIndex].items.filter((_, i) => i !== itemIndex),
      };
      return updated;
    });
  }

  if (loading) {
    return (
      <div className="text-gray-400 text-sm py-8 text-center">
        Loading combo solutions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Combo Solutions / Packages</h3>
        <p className="text-sm text-gray-500">
          Upload a price sheet image and AI will extract the data for you
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            {uploading
              ? "Uploading..."
              : extracting
                ? "Extracting..."
                : "+ Add Combo from Image"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading || extracting}
          />
        </label>
        {status && (
          <span
            className={`text-xs ${status.includes("Error") || status.includes("failed") || status.includes("Failed") ? "text-red-600" : "text-green-600"}`}
          >
            {status}
          </span>
        )}
      </div>

      {combos.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
          No combo solutions yet. Upload a price sheet image to get started, or
          skip this step.
        </div>
      )}

      {combos.map((combo, ci) => {
        const isEditing = editingIndex === ci;

        return (
          <div
            key={ci}
            className="border border-gray-200 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {combo.image_url && (
                  <img
                    src={combo.image_url}
                    alt={combo.name}
                    className="w-32 h-24 object-cover rounded-lg border cursor-pointer"
                    onClick={() => window.open(combo.image_url, "_blank")}
                  />
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      label="Package Name"
                      value={combo.name}
                      onChange={(e) =>
                        updateComboField(ci, "name", e.target.value)
                      }
                    />
                    {Object.entries(combo.tags).map(([key, val]) => (
                      <div key={key} className="flex items-end gap-2">
                        <div className="w-1/3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            value={key}
                            onChange={(e) => renameTag(ci, key, e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                            value={val}
                            onChange={(e) => updateTag(ci, key, e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTag(ci, key)}
                          className="text-red-400 hover:text-red-600 text-xs font-medium pb-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addTag(ci)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                    >
                      + Add Detail
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold">{combo.name}</h4>
                    {Object.keys(combo.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Object.entries(combo.tags)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                            >
                              {k}: {v}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-3">
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(ci)}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => deleteCombo(ci)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Items table */}
            {(isEditing || combo.items.length > 0) && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600">
                      <th className="text-left py-1.5 px-1 font-medium">Item</th>
                      <th className="text-left py-1.5 px-1 font-medium w-20">
                        Qty
                      </th>
                      <th className="text-left py-1.5 px-1 font-medium w-24">
                        Unit Price
                      </th>
                      <th className="text-left py-1.5 px-1 font-medium w-24">
                        Total
                      </th>
                      {isEditing && <th className="w-16"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {combo.items.map((item, ii) => (
                      <tr key={ii} className="border-b border-gray-50">
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              value={item.name}
                              onChange={(e) =>
                                updateItem(ci, ii, "name", e.target.value)
                              }
                            />
                          ) : (
                            item.name
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(ci, ii, "qty", e.target.value)
                              }
                            />
                          ) : (
                            item.qty
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(
                                  ci,
                                  ii,
                                  "unit_price",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            item.unit_price
                          )}
                        </td>
                        <td className="py-1 px-1">
                          {isEditing ? (
                            <input
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50"
                              type="number"
                              value={item.total}
                              readOnly
                            />
                          ) : (
                            item.total
                          )}
                        </td>
                        {isEditing && (
                          <td className="py-1 px-1 text-center">
                            <button
                              onClick={() => removeItem(ci, ii)}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => addItem(ci)}>
                  + Add Item
                </Button>
                <div className="flex-1" />
                <Input
                  label=""
                  placeholder="Grand Total"
                  type="number"
                  value={combo.grand_total}
                  onChange={(e) =>
                    updateComboField(ci, "grand_total", e.target.value)
                  }
                  className="w-32"
                />
                <Button
                  size="sm"
                  onClick={() => saveCombo(ci)}
                  loading={savingId === ci}
                >
                  Confirm & Save
                </Button>
              </div>
            )}

            {!isEditing && combo.grand_total && (
              <div className="text-right font-semibold text-sm">
                Grand Total: {combo.grand_total}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
