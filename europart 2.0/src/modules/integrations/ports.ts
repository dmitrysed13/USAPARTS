export class IntegrationNotConfiguredError extends Error {
  readonly integration: string;

  constructor(integration: string) {
    super(`Интеграция «${integration}» не подключена.`);
    this.name = "IntegrationNotConfiguredError";
    this.integration = integration;
  }
}

export type SupplierSearchHit = {
  supplierCode: string;
  article: string;
  name: string;
};

/**
 * Supplier catalogs, TecDoc and VIN decoders implement this shape later.
 * Stage 1 has no adapter that returns parts.
 */
export interface SupplierCatalogPort {
  readonly key: string;
  searchByArticle(normalizedArticle: string): Promise<SupplierSearchHit[]>;
}

export interface NotificationPort {
  send(input: {
    channel: "email" | "telegram";
    subject: string;
    text: string;
  }): Promise<void>;
}

export const unconfiguredSupplierCatalog: SupplierCatalogPort = {
  key: "supplier-catalog",
  searchByArticle() {
    return Promise.reject(new IntegrationNotConfiguredError("supplier-catalog"));
  },
};

export const unconfiguredNotifications: NotificationPort = {
  async send() {
    throw new IntegrationNotConfiguredError("notifications");
  },
};
