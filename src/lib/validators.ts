import { z } from "zod";

export const vinRequestSchema = z.object({
  vin: z.string().trim().min(1).max(17),
  makeName: z.string().trim().max(80).optional().or(z.literal("")),
  modelName: z.string().trim().max(80).optional().or(z.literal("")),
  year: z.string().trim().optional().or(z.literal("")),
  partDescription: z.string().trim().min(5).max(2000),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, "Укажите телефон."),
  email: z.string().trim().email("Укажите email."),
  company: z.string().optional(),
});

export const inquirySchema = z.object({
  type: z.enum(["QUESTION", "AVAILABILITY", "ORDER_FROM_US"]),
  productId: z.string().trim().min(1).optional().or(z.literal("")),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().min(3).max(2000),
  company: z.string().optional(),
});

export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  deliveryMethodId: z.string().trim().min(1),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/).optional().or(z.literal("")),
  password: z.string().min(8).max(72).regex(/[A-Za-zА-Яа-я]/).regex(/[0-9]/),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});
