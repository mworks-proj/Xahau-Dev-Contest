import { type Client, Transaction } from "xrpl";

interface TransactionMetadata {
  delivered_amount?: string;
}

async function validateTransaction(client: Client, txId: string, expectedAmount: string): Promise<boolean> {
  try {
    // Fetch the transaction details
    const response = await client.request({
      command: "tx",
      transaction: txId,
    });

    const transaction = response.result;

    // Ensure the response includes metadata
    if (transaction && "meta" in transaction) {
      const metadata = transaction.meta as TransactionMetadata;

      if (metadata.delivered_amount) {
        console.log("Delivered Amount:", metadata.delivered_amount);

        // Validate the delivered amount
        if (metadata.delivered_amount === expectedAmount) {
          console.log("Transaction validated successfully.");
          return true;
        }
          console.error("Delivered amount does not match expected amount.");
      }
    }

    console.error("Metadata or delivered amount not found.");
    return false;
  } catch (error) {
    console.error("Error validating transaction:", error);
    return false;
  }
}
