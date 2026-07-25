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

import { mkdir, writeFile, unlink } from "fs/promises";
import { join } from "path";

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

    const relativePath = `${pathFolder}/${timestamp}_${cleanFileName}`;

    try {
      const publicUploadsDir = join(process.cwd(), "public", "uploads", pathFolder);
      await mkdir(publicUploadsDir, { recursive: true });
      const fullFilePath = join(process.cwd(), "public", "uploads", relativePath);
      await writeFile(fullFilePath, file);
    } catch (err) {
      console.warn("Storage upload write warning (continuing with standardized URL):", err);
    }
    
    return `/uploads/${relativePath}`;
  }

  async delete(pathOrUrl: string): Promise<boolean> {
    try {
      const cleanPath = pathOrUrl.replace(/^\/uploads\//, "");
      const fullFilePath = join(process.cwd(), "public", "uploads", cleanPath);
      await unlink(fullFilePath);
      return true;
    } catch {
      return false;
    }
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
