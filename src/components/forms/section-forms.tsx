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
        placeholder="Sharma Steel Fabricators"
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
        placeholder="What does this factory make? What are they known for?"
        value={data.brief_description || ""}
        onChange={(e) => onChange("brief_description", e.target.value)}
      />
    </div>
  );
}

export function ProductsForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Products</h3>
      <p className="text-sm text-gray-500 -mt-2">
        What does the factory produce?
      </p>
      <TextArea
        label="Main Materials / Products"
        placeholder="MS angles, channels, plates, TMT bars..."
        value={data.materials || ""}
        onChange={(e) => onChange("materials", e.target.value)}
        required
      />
      <TextArea
        label="Grades / Specifications (optional)"
        placeholder="IS 2062 Grade A, E250..."
        value={data.grades || ""}
        onChange={(e) => onChange("grades", e.target.value)}
      />
      <TextArea
        label="Standard Products"
        placeholder="What items are usually in stock?"
        value={data.standard_products || ""}
        onChange={(e) => onChange("standard_products", e.target.value)}
      />
      <TextArea
        label="Custom Work"
        placeholder="Do they do custom fabrication? What kind?"
        value={data.custom_work || ""}
        onChange={(e) => onChange("custom_work", e.target.value)}
      />
    </div>
  );
}

export function PricingForm({ data, onChange }: SectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pricing</h3>
      <p className="text-sm text-gray-500 -mt-2">
        Pricing ranges and terms
      </p>
      <TextArea
        label="Price Ranges"
        placeholder="MS sections: Rs 65-75/kg, TMT bars: Rs 55-60/kg..."
        value={data.price_ranges || ""}
        onChange={(e) => onChange("price_ranges", e.target.value)}
        required
      />
      <Input
        label="Price Unit (optional)"
        placeholder="per kg, per piece, per tonne..."
        value={data.price_unit || ""}
        onChange={(e) => onChange("price_unit", e.target.value)}
      />
      <Input
        label="Minimum Order Quantity (optional)"
        placeholder="1 tonne, 100 pieces..."
        value={data.moq || ""}
        onChange={(e) => onChange("moq", e.target.value)}
      />
      <TextArea
        label="Payment Terms (optional)"
        placeholder="Advance, COD, 30-day credit for regulars..."
        value={data.payment_terms || ""}
        onChange={(e) => onChange("payment_terms", e.target.value)}
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
        placeholder="Contractors, builders, small fabricators, retailers..."
        value={data.buyer_types || ""}
        onChange={(e) => onChange("buyer_types", e.target.value)}
      />
      <TextArea
        label="Industries Served (optional)"
        placeholder="Construction, infrastructure, automotive..."
        value={data.industries_served || ""}
        onChange={(e) => onChange("industries_served", e.target.value)}
      />
      <Input
        label="Delivery Areas (optional)"
        placeholder="Mumbai, Thane, Navi Mumbai..."
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
        placeholder="2-3 days for stock items, 7-10 days for custom"
        value={data.standard_lead_time || ""}
        onChange={(e) => onChange("standard_lead_time", e.target.value)}
      />
      <Input
        label="Rush Availability (optional)"
        placeholder="Same-day for urgent orders under 500kg"
        value={data.rush_availability || ""}
        onChange={(e) => onChange("rush_availability", e.target.value)}
      />
      <Input
        label="Production Capacity (optional)"
        placeholder="50 tonnes/month"
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
        placeholder="Mr. Sharma"
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
