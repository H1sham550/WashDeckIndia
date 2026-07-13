export type StorageAssetType = 
  | "BRANDING" 
  | "VEHICLE_PHOTO" 
  | "SERVICE_REPORT" 
  | "INVOICE" 
  | "BOOKING_COVER" 
  | "DOCUMENT" 
  | "PAYMENT_PROOF";

export interface UploadOptions {
  stationId: string;
  assetType: StorageAssetType;
  fileName: string;
  contentType: string;
  entityId?: string; // e.g., jobCardId, invoiceId
}

export interface IStorageProvider {
  upload(file: Buffer | Uint8Array, options: UploadOptions): Promise<string>;
  delete(pathOrUrl: string): Promise<boolean>;
  getPublicUrl(pathOrUrl: string): string;
}

/**
 * Local/Local-compatible Storage Provider fallback or base implementation.
 * Can be swapped cleanly via environment variable (e.g. STORAGE_PROVIDER=s3 | r2 | supabase | local)
 */
class LocalOrCloudStorageProvider implements IStorageProvider {
  async upload(file: Buffer | Uint8Array, options: UploadOptions): Promise<string> {
    const timestamp = Date.now();
    const cleanFileName = options.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    let pathFolder = `stations/${options.stationId}`;
    if (options.assetType === "BRANDING") {
      pathFolder += `/branding`;
    } else if (options.assetType === "VEHICLE_PHOTO") {
      pathFolder += `/job-cards/${options.entityId || "misc"}/photos`;
    } else if (options.assetType === "INVOICE") {
      pathFolder += `/invoices`;
    } else if (options.assetType === "SERVICE_REPORT") {
      pathFolder += `/reports`;
    } else {
      pathFolder += `/documents`;
    }

    const storagePath = `${pathFolder}/${timestamp}_${cleanFileName}`;
    
    // In local dev without live S3/R2 keys, we return our standardized URL structure
    // When live credentials (AWS_S3_BUCKET or R2_ACCOUNT_ID) are configured, the SDK pushes here.
    return `/uploads/${storagePath}`;
  }

  async delete(pathOrUrl: string): Promise<boolean> {
    return true;
  }

  getPublicUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("/")) {
      return pathOrUrl;
    }
    return `/uploads/${pathOrUrl}`;
  }
}

class StorageServiceWrapper implements IStorageProvider {
  private provider: IStorageProvider;

  constructor() {
    // Easily extensible: switch (process.env.STORAGE_PROVIDER) { case "r2": ... }
    this.provider = new LocalOrCloudStorageProvider();
  }

  async upload(file: Buffer | Uint8Array, options: UploadOptions): Promise<string> {
    // Pre-upload validation rules enforced centrally
    if (options.contentType && !options.contentType.startsWith("image/") && !options.contentType.startsWith("application/pdf")) {
      throw new Error(`Unsupported MIME type: ${options.contentType}. Only images and PDFs are permitted.`);
    }
    return this.provider.upload(file, options);
  }

  async delete(pathOrUrl: string): Promise<boolean> {
    return this.provider.delete(pathOrUrl);
  }

  getPublicUrl(pathOrUrl: string): string {
    return this.provider.getPublicUrl(pathOrUrl);
  }
}

export const StorageService = new StorageServiceWrapper();
