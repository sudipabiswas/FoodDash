import { encrypt } from "./encryption";

const BKASH_BASE_URL = "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

interface BkashCredentials {
  username?: string;
  password?: string;
  appKey?: string;
  appSecret?: string;
}

function getCredentials(): BkashCredentials {
  return {
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    appKey: process.env.BKASH_APP_KEY,
    appSecret: process.env.BKASH_APP_SECRET,
  };
}

export function isBkashConfigured(): boolean {
  const creds = getCredentials();
  return !!(creds.username && creds.password && creds.appKey && creds.appSecret);
}

export async function getBkashToken(): Promise<string> {
  const creds = getCredentials();
  if (!isBkashConfigured()) {
    return "MOCK_BKASH_TOKEN";
  }

  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: creds.username!,
      password: creds.password!,
    },
    body: JSON.stringify({
      app_key: creds.appKey,
      app_secret: creds.appSecret,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.id_token) {
    throw new Error(data.errorMessage || "Failed to grant bKash token");
  }

  return data.id_token;
}

export async function createBkashPaymentSession(
  amount: number,
  gatewayTxnId: string,
  appUrl: string
): Promise<{ bkashURL: string; paymentID: string }> {
  if (!isBkashConfigured()) {
    // Return simulator mock redirect
    return {
      bkashURL: `${appUrl}/api/payment/bkash/callback?status=success&paymentID=MOCK_BKASH_PAY_ID_${gatewayTxnId}&tran_id=${gatewayTxnId}`,
      paymentID: `MOCK_BKASH_PAY_ID_${gatewayTxnId}`,
    };
  }

  const token = await getBkashToken();
  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-APP-Key": process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      mode: "0011", // Immediate sale
      payerReference: "FoodDashCustomer",
      callbackURL: `${appUrl}/api/payment/bkash/callback?tran_id=${gatewayTxnId}`,
      amount: amount.toFixed(2),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: gatewayTxnId,
    }),
  });

  const data = await response.json();
  if (data.statusCode !== "0000") {
    throw new Error(data.statusMessage || "Failed to create bKash payment session");
  }

  return {
    bkashURL: data.bkashURL,
    paymentID: data.paymentID,
  };
}

export async function executeBkashPayment(
  paymentId: string
): Promise<any> {
  if (!isBkashConfigured()) {
    return {
      statusCode: "0000",
      statusMessage: "Successful (Simulated)",
      paymentID: paymentId,
      amount: "0.00",
      trxID: `TRX-MOCK-${Math.random().toString(36).substring(3).toUpperCase()}`,
      customerMsisdn: "01777777777",
    };
  }

  const token = await getBkashToken();
  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-APP-Key": process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });

  const data = await response.json();
  return data;
}

export async function queryBkashPayment(
  paymentId: string
): Promise<any> {
  if (!isBkashConfigured()) {
    return {
      statusCode: "0000",
      paymentID: paymentId,
      transactionStatus: "Completed",
    };
  }

  const token = await getBkashToken();
  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-APP-Key": process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });

  return await response.json();
}

export async function refundBkashPayment(
  paymentId: string,
  trxId: string,
  amount: number,
  sku: string = "FoodOrderRefund"
): Promise<any> {
  if (!isBkashConfigured()) {
    return {
      statusCode: "0000",
      statusMessage: "Refund Successful (Simulated)",
      refundTrxID: `REF-MOCK-${Math.random().toString(36).substring(3).toUpperCase()}`,
    };
  }

  const token = await getBkashToken();
  const response = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/payment/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-APP-Key": process.env.BKASH_APP_KEY!,
    },
    body: JSON.stringify({
      paymentID: paymentId,
      amount: amount.toFixed(2),
      trxID: trxId,
      sku,
      reason: "Customer order cancellation",
    }),
  });

  return await response.json();
}
