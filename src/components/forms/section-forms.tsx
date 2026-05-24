"use client";

import { Input } from "@/components/ui/input";
import { TextArea } from "@/components/ui/textarea";

interface SectionProps {
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function BusinessBasicsForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Business Basics</h3>
      <p className="text-sm text-gray-500 -mt-2">
        Basic information about the factory
      </p>
      <Input
        label="Company Name"
        placeholder="e.g. Acme Industries"
        value={data.company_name || ""}
        onChange={(e) => onChange("company_name", e.target.value)}
        required
      />
      <Input
        label="City"
        placeholder="Mumbai"
        value={data.city || ""}
        onChange={(e) => onChange("city", e.target.value)}
        required
      />
      <Input
        label="GST Number (optional)"
        placeholder="22AAAAA0000A1Z5"
        value={data.gst_number || ""}
        onChange={(e) => onChange("gst_number", e.target.value)}
      />
      <Input
        label="Year Founded (optional)"
        placeholder="2005"
        value={data.year_founded || ""}
        onChange={(e) => onChange("year_founded", e.target.value)}
      />
      <TextArea
        label="Brief Description"
        placeholder="What does this business do? What are they known for?"
        value={data.brief_description || ""}
        onChange={(e) => onChange("brief_description", e.target.value)}
      />
    </div>
  );
}

export function CustomersForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customers</h3>
      <p className="text-sm text-gray-500 -mt-2">
        Who typically buys from this factory?
      </p>
      <TextArea
        label="Typical Buyer Types (optional)"
        placeholder="e.g. Contractors, retailers, farmers, restaurants..."
        value={data.buyer_types || ""}
        onChange={(e) => onChange("buyer_types", e.target.value)}
      />
      <TextArea
        label="Industries Served (optional)"
        placeholder="e.g. Construction, agriculture, food service..."
        value={data.industries_served || ""}
        onChange={(e) => onChange("industries_served", e.target.value)}
      />
      <Input
        label="Delivery Areas (optional)"
        placeholder="e.g. Mumbai, Thane, Pune..."
        value={data.delivery_areas || ""}
        onChange={(e) => onChange("delivery_areas", e.target.value)}
      />
    </div>
  );
}

export function LeadTimeForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Lead Time & Capacity</h3>
      <p className="text-sm text-gray-500 -mt-2">
        How quickly can they deliver?
      </p>
      <Input
        label="Standard Lead Time (optional)"
        placeholder="e.g. 2-3 days for stock items, 7-10 days for custom"
        value={data.standard_lead_time || ""}
        onChange={(e) => onChange("standard_lead_time", e.target.value)}
      />
      <Input
        label="Rush Availability (optional)"
        placeholder="e.g. Same-day for urgent orders"
        value={data.rush_availability || ""}
        onChange={(e) => onChange("rush_availability", e.target.value)}
      />
      <Input
        label="Production Capacity (optional)"
        placeholder="e.g. 500 units/month"
        value={data.production_capacity || ""}
        onChange={(e) => onChange("production_capacity", e.target.value)}
      />
    </div>
  );
}

export function ContactInfoForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contact Info</h3>
      <p className="text-sm text-gray-500 -mt-2">
        Owner contact details for the bot
      </p>
      <Input
        label="Owner / Contact Name"
        placeholder="e.g. Mr. Patel"
        value={data.owner_name || ""}
        onChange={(e) => onChange("owner_name", e.target.value)}
        required
      />
      <Input
        label="WhatsApp Number"
        placeholder="+91 98765 43210"
        value={data.whatsapp_number || ""}
        onChange={(e) => onChange("whatsapp_number", e.target.value)}
        required
      />
      <Input
        label="Email (optional)"
        placeholder="owner@company.com"
        type="email"
        value={data.email || ""}
        onChange={(e) => onChange("email", e.target.value)}
      />
    </div>
  );
}
