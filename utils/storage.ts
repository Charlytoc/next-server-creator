import { Storage, Bucket } from "@google-cloud/storage";

let storageInstance: Storage | null = null;
let bucketInstance: Bucket | null = null;

const getStorage = (): Storage => {
  if (!storageInstance) {
    const credentialsJson = process.env.GCP_CREDENTIALS_JSON;
    if (!credentialsJson) {
      throw new Error("GCP_CREDENTIALS_JSON environment variable is not set");
    }

    const credentials = JSON.parse(credentialsJson);
    storageInstance = new Storage({
      credentials,
    });
  }

  return storageInstance;
};

export const getBucket = (): Bucket => {
  if (!bucketInstance) {
    const bucketName = process.env.GCP_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("GCP_BUCKET_NAME environment variable is not set");
    }

    const storage = getStorage();
    bucketInstance = storage.bucket(bucketName);
  }

  return bucketInstance;
};

export const uploadFileToBucket = async (
  bucket: Bucket,
  file: string,
  path: string
) => {
  const fileRef = bucket.file(path);
  await fileRef.save(Buffer.from(file, "utf8"));
};

