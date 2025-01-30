# XMerch

**XMerch** is a proof-of-concept (PoC) store demonstrating how to integrate **Next.js**, **XUMM**, and **XRPL/Xahau** payment flows to sell real-world merchandise without the hefty fees of traditional payment gateways. Our goal is to enable merchants—especially those with limited budgets or non-technical backgrounds—to easily accept cryptocurrency payments on the **XRPL** and **Xahau** networks.

> **Live URL (Pre-Production / Soft Launch):**  
> [https://merch-25.vercel.app/](https://merch-25.vercel.app/)  
> *(Currently only accepting real $XAH on Xahau mainnet for contest testing.)*

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Key Features](#key-features)  
3. [Current Soft-Launch Logic](#current-soft-launch-logic)  
4. [Database & Orders](#database--orders)  
5. [Environment Variables](#environment-variables)  
6. [Getting Started](#getting-started)  
7. [Hooks & Smart Contracts](#hooks--smart-contracts)  
8. [Roadmap / Upcoming Features](#roadmap--upcoming-features)  
9. [Timeline](#timeline)  
10. [Contribution & License](#contribution--license)  
11. [Contact / Feedback](#contact--feedback)

---

## 1. Project Overview

### What is XMerch?
XMerch is a template/stack for showcasing real-world commerce on the XRPL and Xahau networks. It allows merchants to accept crypto payments with minimal transaction fees compared to traditional gateways (Stripe, Square, etc.).

### Why XMerch?
- Many small businesses are forced to pay high fees or handle complicated integrations when trying to accept crypto payments.  
- We aim to provide user-friendly repos and guides for quickly deploying a Web3-compatible store.

### Contest Submission
This repository (or branch) is prepared for the [Xahau Dev Contest](https://github.com/XRPL-Labs/Xahau-Dev-Contest). It demonstrates a working payment flow using **$XAH** on the mainnet.

---

## 2. Key Features

### Live (Soft-Launch) Storefront
- Deployed on Vercel at [merch-25.vercel.app](https://merch-25.vercel.app/).
- Currently forces **$XAH** payments on mainnet (though logic for XRPL is present).

### Transaction Workflow
- Each product is priced at **0.01 $XAH** + shipping/handling of **0.03 $XAH**.
- Payments handled via [XUMM](https://xumm.app/) integration.

### Reward Mechanism
- **50%** of each sale goes to a **vault** via our `rewardHook`.
- Future random giveaways from the vault to testers.

### Data Storage & Orders
- Shipping address, email, and order info are stored in a Supabase database.
- `/orders` page shows recent purchases, tied to each wallet address.

### Preconfigured Stack
- Built on **Next.js** (with EvernodeXRPL Hosting in the pipe).
- Currently includes placeholder experimentation code from [Optimizely Feature Experimentation](https://www.optimizely.com/products/feature-experimentation/) and Vercel Edge Config.

---

## 3. Current Soft-Launch Logic

- **Mainnet Only**: For the **Xahau Dev Contest**, the store is forced to accept $XAH (Xahau mainnet).
- **Dev Testing**: We invite devs to buy mock products (no physical delivery during soft-launch).
- **Shipping Form**: Shipping address must be entered (dummy address is acceptable), but a valid email is requested for potential order tracking.
- **Vault Split**: Once a payment is confirmed, 50% is automatically sent to the vault. The other 50% goes to the merchant’s address.

---

## 4. Database & Orders

### Supabase Integration
- We store user wallet addresses, shipping address, and email.
- This allows us to track orders on the `/orders` page.

### XRPL vs. Xahau
- Our code can handle both XRPL and Xahau transactions. However, for the contest, XMerch uses Xahau exclusively.
- After the contest, XRPL network switching can be re-enabled to support multiple networks in production.

---

## 5. Environment Variables
_(See `env.example` for details on required variables)_

---

## 6. Getting Started

### Clone & Install
```bash
git clone https://github.com/mworks-proj/xmerch
cd xmerch
pnpm install
```

### Environment Setup
- Copy `.env.example` to `.env` and fill in real values (if you plan to run local tests).
- Ensure you have the correct wallet details if you want to test mainnet transactions.

### Run Development Server
```bash
pnpm run dev
```
- Visit [http://localhost:3000](http://localhost:3000) to view the store.


### Testing webhook requires NGROK (https://ngrok.com/ )


### Test a Purchase
- Pick an item (product price .01 + 0.01 shipping + 10% handling = total 0.03 ).
- Connect XUMM (using your Xahau wallet).
- Enter shipping details (dummy address is fine).
- Confirm the payment on your XUMM app.
- Check Order via  🔎 explorer link

---

## 7. Hooks & Smart Contracts

### `rewardHook`
- Automatically splits **50%** of the sale price into a **vault**.
- The logic can track or annotate the transaction with memos/hashes.

### `giveawayHook` (Upcoming)
- Will randomly select a wallet from the vault’s transaction list to receive a giveaway.
- Enhanced by logging transaction memos or hashes to identify participants.

### `subscriptionHook` (Planned)
- Future recurring payment model for SaaS or subscription-based purchases on Xahau.

---

## 8. Roadmap / Upcoming Features

1. **BlindBox / Recurring Subscriptions**
2. **Automated Fulfillment**
3. **Multi-Network Support**
4. **Stronger Validation**
5. **Analytics & Insights**

---

## 9. Timeline

- **Submission Date**: January 31 (Xahau Dev Contest)
- **Live Product Drop ETA**: February 5

---

## 10. Contribution & License

- **Contributions**: Open an Issue for feedback.
- **License**: MIT License

---

## 11. Contact / Feedback

- **Team**: [Your Name / Team Name]
- **Email**: [team@yourdomain.com]
- **Issues**: [GitHub Issues](https://github.com/your-org/xmerch-contest/issues)

> We welcome feedback from contest judges and community devs!

