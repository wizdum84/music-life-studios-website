import "dotenv/config";

import {
  deleteObject,
  createPrivateDownloadUrl,
  isObjectStorageConfigured,
  putPrivateObject,
  putPublicObject,
} from "../server/services/object-storage";

const testKey = `connection-tests/${Date.now()}-${crypto.randomUUID()}.txt`;
const body = "Music Life Studios R2 connection test";

if (!isObjectStorageConfigured()) {
  throw new Error("R2 storage configuration is incomplete");
}

for (const area of ["public", "private"] as const) {
  let uploaded = false;
  try {
    if (area === "public") {
      const result = await putPublicObject(testKey, body, "text/plain");
      if (!result.url) throw new Error("PUBLIC_MEDIA_BASE_URL is not configured");
      const response = await fetch(result.url);
      if (!response.ok || await response.text() !== body) {
        throw new Error(`Public delivery failed with HTTP ${response.status}`);
      }
      console.log("public URL: HTTPS delivery succeeded");
    } else {
      await putPrivateObject(testKey, body, "text/plain");
      const url = await createPrivateDownloadUrl(testKey, 60, "connection-test.txt");
      const response = await fetch(url);
      if (!response.ok || await response.text() !== body) {
        throw new Error(`Private signed delivery failed with HTTP ${response.status}`);
      }
      console.log("private URL: signed HTTPS delivery succeeded");
    }
    uploaded = true;
    console.log(`${area} bucket: write succeeded`);
  } finally {
    if (uploaded) {
      await deleteObject(area, testKey);
      console.log(`${area} bucket: cleanup succeeded`);
    }
  }
}

console.log("R2 connection verified");
