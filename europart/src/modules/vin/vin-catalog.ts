import { IntegrationNotConfiguredError } from "@/modules/integrations/ports";

/**
 * VIN catalog / decoder port.
 * Implementations must never invent make/model/engine from a VIN.
 * Until a real decoder is wired, decode stays unavailable.
 */
export type VinDecodeUnavailable = {
  vin: string;
  decoded: false;
  reason: "not_configured" | "provider_error";
  message: string;
};

export type VinDecodeSuccess = {
  vin: string;
  decoded: true;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  raw?: Record<string, unknown>;
};

export type VinDecodeResult = VinDecodeUnavailable | VinDecodeSuccess;

export interface VinCatalogPort {
  readonly key: string;
  decode(vin: string): Promise<VinDecodeResult>;
}

export const unconfiguredVinCatalog: VinCatalogPort = {
  key: "vin-catalog",
  async decode(vin) {
    return {
      vin,
      decoded: false,
      reason: "not_configured",
      message:
        "Автоматическая расшифровка VIN не подключена. Заявка сохраняется для ручной проверки менеджером.",
    };
  },
};

/** Rejects any attempt to treat an unconfigured adapter as a successful decode. */
export async function decodeVinOrUnavailable(
  vin: string,
  adapter: VinCatalogPort = unconfiguredVinCatalog,
): Promise<VinDecodeUnavailable | VinDecodeSuccess> {
  try {
    const result = await adapter.decode(vin);
    if (result.decoded) {
      return result;
    }
    return result;
  } catch (error) {
    if (error instanceof IntegrationNotConfiguredError) {
      return {
        vin,
        decoded: false,
        reason: "not_configured",
        message: error.message,
      };
    }
    return {
      vin,
      decoded: false,
      reason: "provider_error",
      message: "Сервис расшифровки VIN временно недоступен.",
    };
  }
}
