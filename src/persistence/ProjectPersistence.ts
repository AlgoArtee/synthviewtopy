export const PROJECT_SCHEMA_V2 = 'youtopy.lab-island/2.0' as const;
export const PROJECT_STORAGE_KEY = 'youtopy_saved_project';
export const LEGACY_PROJECT_BACKUP_KEY = 'youtopy_saved_project_v1_backup';

const DATABASE_NAME = 'synthviewtopy-projects';
const DATABASE_VERSION = 1;
const ACTIVE_PROJECT_ID = 'default';
const MAX_RECOVERY_REVISIONS = 10;

export interface PersistedAssetReference {
  assetId: string;
  sha256: string;
  filename: string;
  extension: string;
  mimeType: string;
  byteLength: number;
}

export interface PersistedAssetRecord extends PersistedAssetReference {
  blob: Blob;
  savedAt: string;
}

interface StoredProjectRecord {
  id: string;
  revision: number;
  savedAt: string;
  checksum: string;
  payload: any;
}

interface StoredRevisionRecord extends StoredProjectRecord {
  revisionId: string;
}

export interface LoadedProject {
  payload: any;
  revision: number;
  savedAt: string;
  source: 'current' | 'recovery' | 'local-storage';
  missingAssetIds: string[];
}

export interface ProjectPersistenceSnapshot {
  schema: typeof PROJECT_SCHEMA_V2;
  revision: number;
  savedAt: string | null;
  source: LoadedProject['source'] | 'none';
  recoveryRevisionCount: number;
  assetCount: number;
  missingAssetIds: string[];
  persistentStorageGranted: boolean | null;
  lastError: string | null;
  legacyBackupAvailable?: boolean;
  missingLegacyImportCount?: number;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Blob(blob: Blob) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()));
}

export async function sha256Text(text: string) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

function assetReferencesFromPayload(payload: any): PersistedAssetReference[] {
  return Array.isArray(payload?.assets)
    ? payload.assets.filter((asset: unknown): asset is PersistedAssetReference => (
      Boolean(asset)
      && typeof (asset as PersistedAssetReference).assetId === 'string'
      && typeof (asset as PersistedAssetReference).sha256 === 'string'
    ))
    : [];
}

export class ProjectPersistenceStore {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private revision = 0;
  private savedAt: string | null = null;
  private source: ProjectPersistenceSnapshot['source'] = 'none';
  private missingAssetIds: string[] = [];
  private persistentStorageGranted: boolean | null = null;
  private lastError: string | null = null;

  private openDatabase() {
    if (this.databasePromise) return this.databasePromise;
    this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('projects')) {
          database.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains('revisions')) {
          const revisions = database.createObjectStore('revisions', { keyPath: 'revisionId' });
          revisions.createIndex('projectId', 'id', { unique: false });
        }
        if (!database.objectStoreNames.contains('assets')) {
          database.createObjectStore('assets', { keyPath: 'assetId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Unable to open project storage.'));
    });
    return this.databasePromise;
  }

  async requestPersistentStorage() {
    try {
      this.persistentStorageGranted = typeof navigator.storage?.persist === 'function'
        ? await navigator.storage.persist()
        : null;
    } catch {
      this.persistentStorageGranted = false;
    }
    return this.persistentStorageGranted;
  }

  async putAsset(blob: Blob, filename: string): Promise<PersistedAssetReference> {
    const sha256 = await sha256Blob(blob);
    const extension = filename.includes('.') ? filename.split('.').pop()!.toLowerCase() : 'bin';
    const reference: PersistedAssetReference = {
      assetId: `sha256-${sha256}`,
      sha256,
      filename,
      extension,
      mimeType: blob.type || 'application/octet-stream',
      byteLength: blob.size,
    };
    const database = await this.openDatabase();
    const transaction = database.transaction('assets', 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore('assets').put({
      ...reference,
      blob,
      savedAt: new Date().toISOString(),
    } satisfies PersistedAssetRecord);
    await completed;
    return reference;
  }

  async putAssetRecord(record: PersistedAssetRecord) {
    if (await sha256Blob(record.blob) !== record.sha256) {
      throw new Error(`Asset checksum mismatch for ${record.filename}.`);
    }
    const database = await this.openDatabase();
    const transaction = database.transaction('assets', 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore('assets').put(record);
    await completed;
  }

  async getAsset(assetId: string): Promise<PersistedAssetRecord | null> {
    const database = await this.openDatabase();
    const transaction = database.transaction('assets', 'readonly');
    const completed = transactionComplete(transaction);
    const record = await requestResult(
      transaction.objectStore('assets').get(assetId) as IDBRequest<PersistedAssetRecord | undefined>,
    );
    await completed;
    if (!record) return null;
    if (record.byteLength !== record.blob.size || await sha256Blob(record.blob) !== record.sha256) {
      this.lastError = `Stored asset ${record.filename} failed integrity verification.`;
      return null;
    }
    return record;
  }

  private async missingAssets(payload: any) {
    const references = assetReferencesFromPayload(payload);
    const missing: string[] = [];
    for (const reference of references) {
      const record = await this.getAsset(reference.assetId);
      if (!record || record.sha256 !== reference.sha256) missing.push(reference.assetId);
    }
    return missing;
  }

  async saveProject(payload: any) {
    if (payload?.schema !== PROJECT_SCHEMA_V2 || !Array.isArray(payload?.objects)) {
      throw new Error('Project validation failed: unsupported or incomplete project document.');
    }
    // Referenced binaries are written before the document commit. Refuse to
    // replace the last known-good project if any reference is missing or
    // corrupt; unreferenced deduplicated blobs are safe to retain.
    const missingAssetIds = await this.missingAssets(payload);
    if (missingAssetIds.length) {
      this.missingAssetIds = missingAssetIds;
      this.lastError = `Project save blocked: ${missingAssetIds.length} referenced asset(s) are missing or corrupt.`;
      throw new Error(this.lastError);
    }
    const database = await this.openDatabase();
    const savedAt = new Date().toISOString();
    const previous = await this.getCurrentRecord();
    const revision = Math.max(this.revision, previous?.revision ?? 0) + 1;
    const checksum = await sha256Text(JSON.stringify(payload));
    const record: StoredProjectRecord = {
      id: ACTIVE_PROJECT_ID,
      revision,
      savedAt,
      checksum,
      payload,
    };
    const recovery: StoredRevisionRecord = {
      ...record,
      revisionId: `${ACTIVE_PROJECT_ID}:${String(revision).padStart(12, '0')}`,
    };
    const transaction = database.transaction(['projects', 'revisions'], 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore('projects').put(record);
    transaction.objectStore('revisions').put(recovery);
    await completed;
    await this.trimRecoveryRevisions();
    this.revision = revision;
    this.savedAt = savedAt;
    this.source = 'current';
    this.missingAssetIds = [];
    this.lastError = null;
    return { revision, savedAt, missingAssetIds: [...this.missingAssetIds] };
  }

  private async getCurrentRecord() {
    const database = await this.openDatabase();
    const transaction = database.transaction('projects', 'readonly');
    const completed = transactionComplete(transaction);
    const record = await requestResult(
      transaction.objectStore('projects').get(ACTIVE_PROJECT_ID) as IDBRequest<StoredProjectRecord | undefined>,
    );
    await completed;
    return record ?? null;
  }

  private async getRecoveryRecords() {
    const database = await this.openDatabase();
    const transaction = database.transaction('revisions', 'readonly');
    const completed = transactionComplete(transaction);
    const records = await requestResult(
      transaction.objectStore('revisions').index('projectId').getAll(ACTIVE_PROJECT_ID) as IDBRequest<StoredRevisionRecord[]>,
    );
    await completed;
    return records.sort((a, b) => b.revision - a.revision);
  }

  private async trimRecoveryRevisions() {
    const records = await this.getRecoveryRecords();
    const expired = records.slice(MAX_RECOVERY_REVISIONS);
    if (!expired.length) return;
    const database = await this.openDatabase();
    const transaction = database.transaction('revisions', 'readwrite');
    const completed = transactionComplete(transaction);
    expired.forEach((record) => transaction.objectStore('revisions').delete(record.revisionId));
    await completed;
  }

  private async verifyProjectRecord(record: StoredProjectRecord) {
    if (!record?.payload || record.payload.schema !== PROJECT_SCHEMA_V2) return null;
    if (await sha256Text(JSON.stringify(record.payload)) !== record.checksum) return null;
    const missingAssetIds = await this.missingAssets(record.payload);
    return { record, missingAssetIds };
  }

  async loadProject(): Promise<LoadedProject | null> {
    try {
      const current = await this.getCurrentRecord();
      if (current) {
        const verified = await this.verifyProjectRecord(current);
        if (verified) {
          this.revision = current.revision;
          this.savedAt = current.savedAt;
          this.source = 'current';
          this.missingAssetIds = verified.missingAssetIds;
          this.lastError = verified.missingAssetIds.length
            ? `Project loaded with ${verified.missingAssetIds.length} missing asset(s).`
            : null;
          return {
            payload: current.payload,
            revision: current.revision,
            savedAt: current.savedAt,
            source: 'current',
            missingAssetIds: verified.missingAssetIds,
          };
        }
      }
      const recoveries = await this.getRecoveryRecords();
      for (const recovery of recoveries) {
        const verified = await this.verifyProjectRecord(recovery);
        if (!verified) continue;
        this.revision = recovery.revision;
        this.savedAt = recovery.savedAt;
        this.source = 'recovery';
        this.missingAssetIds = verified.missingAssetIds;
        this.lastError = 'The active project was invalid; a recovery revision was loaded.';
        return {
          payload: recovery.payload,
          revision: recovery.revision,
          savedAt: recovery.savedAt,
          source: 'recovery',
          missingAssetIds: verified.missingAssetIds,
        };
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
    }
    return null;
  }

  async backupLegacyPayload(payload: any) {
    if (!payload || payload.schema !== 'youtopy.lab-island/1.0') return;
    if (!localStorage.getItem(LEGACY_PROJECT_BACKUP_KEY)) {
      localStorage.setItem(LEGACY_PROJECT_BACKUP_KEY, JSON.stringify(payload));
    }
  }

  async getReferencedAssets(payload: any) {
    const records: PersistedAssetRecord[] = [];
    for (const reference of assetReferencesFromPayload(payload)) {
      const record = await this.getAsset(reference.assetId);
      if (record) records.push(record);
    }
    return records;
  }

  async getSnapshot(): Promise<ProjectPersistenceSnapshot> {
    let recoveryRevisionCount = 0;
    let assetCount = 0;
    try {
      recoveryRevisionCount = (await this.getRecoveryRecords()).length;
      const database = await this.openDatabase();
      const transaction = database.transaction('assets', 'readonly');
      const completed = transactionComplete(transaction);
      assetCount = await requestResult(transaction.objectStore('assets').count());
      await completed;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
    }
    return {
      schema: PROJECT_SCHEMA_V2,
      revision: this.revision,
      savedAt: this.savedAt,
      source: this.source,
      recoveryRevisionCount,
      assetCount,
      missingAssetIds: [...this.missingAssetIds],
      persistentStorageGranted: this.persistentStorageGranted,
      lastError: this.lastError,
    };
  }
}
