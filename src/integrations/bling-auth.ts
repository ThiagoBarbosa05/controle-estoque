import { db } from "@/db";
import { erpTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function refreshBlingToken() {
  try {
    const [blingToken] = await db
      .select()
      .from(erpTokens)
      .where(eq(erpTokens.erpName, "bling"))
      .limit(1);

    if (!blingToken) {
      throw new Error("No Bling token found on DB");
    }

    const response = await fetch(
      "https://www.bling.com.br/Api/v3/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "1.0",
          Authorization: `Basic ${process.env.BLING_CREDENTIALS_BASE_64}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: blingToken?.refreshToken,
        }),
      }
    );

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`Failed to refresh Bling token: ${errorResponse}`);
    }

    const data = await response.json();

    const [tokenUpdated] = await db
      .update(erpTokens)
      .set({
        ...blingToken,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      })
      .returning();

    return tokenUpdated;
  } catch (error) {
    console.error("Error refreshing Bling token:", error);
    throw error;
  }
}

export async function exchangeBlingCodeForToken(code: string) {
  try {
    const response = await fetch(
      "https://www.bling.com.br/Api/v3/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "1.0",
          Authorization: `Basic ${process.env.BLING_CREDENTIALS_BASE_64}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
        }),
      }
    );

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(
        `Failed to exchange Bling code for token: ${errorResponse}`
      );
    }

    const data = await response.json();

    const [tokenUpdated] = await db
      .update(erpTokens)
      .set({
        erpName: "bling",
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      })
      .returning();

    return tokenUpdated;
  } catch (error) {
    console.error("Error exchanging Bling code for token:", error);
    throw error;
  }
}

export async function getBlingAccessToken() {
  const [blingToken] = await db
    .select()
    .from(erpTokens)
    .where(eq(erpTokens.erpName, "bling"))
    .limit(1);
  if (!blingToken) {
    throw new Error("No Bling token found on DB");
  }
  return blingToken.accessToken;
}

/**
 * Validates if the current Bling access token is still valid by making a test API call
 * @returns Promise<{isValid: boolean, error?: string}> - Object with validation result
 */
export async function validateBlingToken(): Promise<{
  isValid: boolean;
  error?: string;
}> {
  try {
    const [blingToken] = await db
      .select()
      .from(erpTokens)
      .where(eq(erpTokens.erpName, "bling"))
      .limit(1);

    if (!blingToken) {
      return {
        isValid: false,
        error: "No Bling token found in database",
      };
    }

    // Make a minimal test API call to validate the token
    // Using the /situacao endpoint as it's lightweight and requires authentication
    const response = await fetch(
      "https://www.bling.com.br/Api/v3/situacoes/modulos",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${blingToken.accessToken}`,
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      // Token is expired or invalid, try to refresh it
      try {
        await refreshBlingToken();
        return {
          isValid: true,
        };
      } catch (refreshError) {
        return {
          isValid: false,
          error: `Token expired and refresh failed: ${
            refreshError instanceof Error
              ? refreshError.message
              : "Unknown error"
          }`,
        };
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      return {
        isValid: false,
        error: `Bling API error (${response.status}): ${errorText}`,
      };
    }

    // Token is valid
    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Token validation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
