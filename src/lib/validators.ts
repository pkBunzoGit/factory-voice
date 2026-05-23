import { z } from "zod";

// --- Agent Auth ---
export const agentLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  pin: z
    .string()
    .length(6, "PIN must be 6 digits")
    .regex(/^\d+$/, "PIN must be numeric"),
});

// --- Owner Auth ---
export const ownerLoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- Factory Creation ---
export const createFactorySchema = z.object({
  name: z.string().min(2, "Factory name is required"),
  city: z.string().min(2, "City is required"),
});

// --- Factory Profile Sections ---
export const businessBasicsSchema = z.object({
  company_name: z.string().min(1),
  city: z.string().min(1),
  gst_number: z.string().optional(),
  year_founded: z.string().optional(),
  brief_description: z.string().optional(),
});

export const productsSchema = z.object({
  materials: z.string().min(1, "List your main materials"),
  grades: z.string().optional(),
  standard_products: z.string().optional(),
  custom_work: z.string().optional(),
});

export const pricingSchema = z.object({
  price_ranges: z.string().min(1, "Add at least rough pricing"),
  price_unit: z.string().optional(),
  moq: z.string().optional(),
  payment_terms: z.string().optional(),
});

export const customersSchema = z.object({
  buyer_types: z.string().optional(),
  industries_served: z.string().optional(),
  delivery_areas: z.string().optional(),
});

export const leadTimeSchema = z.object({
  standard_lead_time: z.string().optional(),
  rush_availability: z.string().optional(),
  production_capacity: z.string().optional(),
});

export const contactInfoSchema = z.object({
  owner_name: z.string().min(1, "Owner name is required"),
  whatsapp_number: z.string().min(10, "WhatsApp number is required"),
  email: z.string().email().optional().or(z.literal("")),
});

export const profileSections = [
  { key: "business_basics", label: "Business Basics", schema: businessBasicsSchema },
  { key: "products", label: "Products", schema: productsSchema },
  { key: "pricing", label: "Pricing", schema: pricingSchema },
  { key: "customers", label: "Customers", schema: customersSchema },
  { key: "lead_time", label: "Lead Time & Capacity", schema: leadTimeSchema },
  { key: "contact_info", label: "Contact Info", schema: contactInfoSchema },
] as const;

// --- Lead Capture ---
export const leadCaptureSchema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .max(15)
    .regex(/^\+?\d+$/, "Enter digits only"),
});

// --- Chat Message ---
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(1000, "Message too long"),
});

// --- Types ---
export type AgentLoginInput = z.infer<typeof agentLoginSchema>;
export type OwnerLoginInput = z.infer<typeof ownerLoginSchema>;
export type CreateFactoryInput = z.infer<typeof createFactorySchema>;
export type BusinessBasicsInput = z.infer<typeof businessBasicsSchema>;
export type ProductsInput = z.infer<typeof productsSchema>;
export type PricingInput = z.infer<typeof pricingSchema>;
export type CustomersInput = z.infer<typeof customersSchema>;
export type LeadTimeInput = z.infer<typeof leadTimeSchema>;
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
