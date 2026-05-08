import { google } from "googleapis";

/**
 * Submits a list of URLs to the Google Indexing API.
 * Google Indexing API has a default daily quota of 200 URLs.
 * 
 * To prevent exceeding the quota, it's recommended to limit submissions
 * to a safe amount per day (e.g., 150 URLs).
 */
export async function submitToGoogleIndexing(urls: string[]): Promise<{
  status: string;
  successCount: number;
  failedCount: number;
  errors: string[];
}> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    return {
      status: "unconfigured",
      successCount: 0,
      failedCount: urls.length,
      errors: ["Google Indexing API credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY) are not set in .env."],
    };
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });

    const indexing = google.indexing({
      version: "v3",
      auth,
    });

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process URLs. We can send them sequentially to respect API rate limits.
    for (const url of urls) {
      try {
        await indexing.urlNotifications.publish({
          requestBody: {
            url,
            type: "URL_UPDATED",
          },
        });
        successCount++;
      } catch (err: any) {
        failedCount++;
        errors.push(`${url}: ${err.message}`);
        console.error(`Google Indexing API failed for ${url}:`, err);
      }
    }

    return {
      status: failedCount === 0 ? "success" : successCount > 0 ? "partial_success" : "failed",
      successCount,
      failedCount,
      errors,
    };
  } catch (globalError: any) {
    console.error("Google Indexing API initialization failed:", globalError);
    return {
      status: "error",
      successCount: 0,
      failedCount: urls.length,
      errors: [globalError.message],
    };
  }
}
