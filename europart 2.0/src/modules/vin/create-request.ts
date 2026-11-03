import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { assessVin } from "@/modules/vin/assess-vin";
import type { VinRequestInput } from "@/modules/vin/schema";

export class VinRequestStoreError extends Error {
  constructor(cause?: unknown) {
    super("Заявку не удалось сохранить.");
    this.name = "VinRequestStoreError";
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export async function createVinRequest(input: VinRequestInput, ip: string) {
  const vin = assessVin(input.vin);
  if (!vin.ok || !input.consent || (!input.phone && !input.email)) {
    throw new VinRequestStoreError();
  }
  if (input.vehicleYear !== null && Number.isNaN(input.vehicleYear)) {
    throw new VinRequestStoreError();
  }

  try {
    const row = await getPrismaClient().vinRequest.create({
      data: {
        vin: vin.vin,
        vinIsStandard: vin.standard,
        vehicleBrand: input.vehicleBrand,
        vehicleModel: input.vehicleModel,
        vehicleYear: input.vehicleYear,
        engine: input.engine,
        partName: input.partName,
        partNumber: input.partNumber,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        comment: input.comment,
        consentAccepted: true,
        consentAt: new Date(),
        ip: ip.slice(0, 64),
        status: "NEW",
      },
      select: { id: true, status: true },
    });
    return { id: row.id, status: row.status, notice: vin.notice };
  } catch (error) {
    throw new VinRequestStoreError(error);
  }
}
