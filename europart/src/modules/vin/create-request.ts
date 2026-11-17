import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { assessVin } from "@/modules/vin/assess-vin";
import { notifyManagersAboutVinRequest } from "@/modules/vin/notify";
import type { VinRequestInput } from "@/modules/vin/schema";
import { decodeVinOrUnavailable } from "@/modules/vin/vin-catalog";

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

  // Explicit: never fill vehicle fields from a fake decode.
  const decode = await decodeVinOrUnavailable(vin.vin);
  if (decode.decoded) {
    // Real adapter may enrich later; still do not overwrite customer-provided values.
  }

  try {
    const row = await getPrismaClient().$transaction(async (tx) => {
      const created = await tx.vinRequest.create({
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
          history: {
            create: {
              fromStatus: null,
              toStatus: "NEW",
              comment: input.comment,
              actor: "customer",
            },
          },
        },
        select: {
          id: true,
          status: true,
          vin: true,
          vinIsStandard: true,
          customerName: true,
          phone: true,
          email: true,
          comment: true,
          partName: true,
          partNumber: true,
          vehicleBrand: true,
          vehicleModel: true,
          vehicleYear: true,
        },
      });
      return created;
    });

    await notifyManagersAboutVinRequest(row);

    const decodeNotice =
      !decode.decoded && decode.message ? decode.message : null;
    const notice = [vin.notice, decodeNotice].filter(Boolean).join(" ") || null;

    return { id: row.id, status: row.status, notice };
  } catch (error) {
    throw new VinRequestStoreError(error);
  }
}
