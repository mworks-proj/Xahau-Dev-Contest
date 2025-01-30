import optimizely from "@optimizely/optimizely-sdk";
import { unstable_flag as flag } from "@vercel/flags/next";
import { getShopperFromHeaders } from "./utils";
import { get } from "@vercel/edge-config";

export const showBuyNowFlag = flag<{
  enabled: boolean;
  buttonText?: string;
}>({
  key: "buynow",
  description: "Flag for showing Buy Now button on PDP",
  options: [
    { label: "Hide", value: { enabled: false } },
    { label: "Show", value: { enabled: true } },
  ],
  async decide({ headers }) {
    const datafile = await get("datafile");

    if (!datafile) {
      throw new Error("Failed to retrive datafile from Vercel Edge Config");
    }

    let flag = { enabled: false, buttonText: "" };

    try {
      const client = optimizely.createInstance({
        datafile: datafile as object,
        eventDispatcher: {
          dispatchEvent: (event) => {},
        },
      });

      if (!client) {
        throw new Error("Failed to create client");
      }

      await client.onReady({ timeout: 500 });

      const shopper = getShopperFromHeaders(headers);
      const context = client.createUserContext(shopper);

      if (!context) {
        throw new Error("Failed to create user context");
      }

      const decision = context.decide("buynow");
      flag = {
        enabled: decision.enabled,
        buttonText: decision.variables.buynow_text as string,
      };
    } catch (error) {
      console.error("Optimizely error:", error);
    } finally {
      // biome-ignore lint/correctness/noUnsafeFinally: <explanation>
      return flag;
    }
  },
});

export const showPromoBannerFlag = flag<boolean>({
  key: "showPromoBanner",
  defaultValue: true,
  description: "Flag for showing promo banner on homepage",
  options: [
    { value: false, label: "Hide" },
    { value: true, label: "Show" },
  ],
  async decide() {
    return false; // Temporarily force the flag to always show
  },
});

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export default async function handler(req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { showBanner: boolean; }): void; new(): any; }; }; }) {
  const showBanner = true; // Logic to decide if the banner should show
  res.status(200).json({ showBanner });
}

export const precomputeFlags = [showPromoBannerFlag] as const;
