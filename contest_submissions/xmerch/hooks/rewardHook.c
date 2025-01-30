//------------------------------------------------------------------------------
/*
    This hook:
      - Checks for an incoming Payment to the hooking account
      - Verifies currency == XAH
      - Emits a second Payment for 50% to XAH_FORWARD_ACT
      - Accepts the original transaction (non-override).
*/
//------------------------------------------------------------------------------

#include "hookapi.h"
#include "macro.h"   // Ensure we have macros like DONE, SBUF, etc.

#define CURRENCY_OFFSET 8U

// The skeleton for building the emitted Payment:
uint8_t txn[283] =
{
 /*   3,  0 */  0x12U, 0x00U, 0x00U,                                        /* tt = Payment */
 /*   5,  3 */  0x22U, 0x80U, 0x00U, 0x00U, 0x00U,                          /* flags = tfCanonical */
 /*   5,  8 */  0x24U, 0x00U, 0x00U, 0x00U, 0x00U,                          /* sequence = 0 */
 /*   5, 13 */  0x99U, 0x99U, 0x99U, 0x99U, 0x99U,                          /* dtag placeholder */
 /*   6, 18 */  0x20U, 0x1AU, 0x00U, 0x00U, 0x00U, 0x00U,                   /* first ledger seq */
 /*   6, 24 */  0x20U, 0x1BU, 0x00U, 0x00U, 0x00U, 0x00U,                   /* last ledger seq */
 /*  49, 30 */  0x61U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,     /* Amount field (49 bytes) */
               0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
               0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
               0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
               0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
               0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
 /*   9, 79 */  0x68U, 0x40U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, /* Fee */
 /*  35, 88 */  0x73U, 0x21U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, /* pubkey placeholder */
 /*  22,123 */  0x81U, 0x14U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,         /* sfAccount (20 bytes) */
 /*  22,145 */  0x83U, 0x14U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,         /* sfDestination (20 bytes) */
 /* 116,167 */
};

// Offsets in the txn buffer
#define FLS_OUT      (txn + 20U)
#define LLS_OUT      (txn + 26U)
#define DTAG_OUT     (txn + 14U)
#define AMOUNT_OUT   (txn + 30U)
#define FEE_OUT      (txn + 80U)
#define HOOK_ACC     (txn + 125U)
#define OTX_ACC      (txn + 147U)

#define XAH_FORWARD_ACT  "rewardVault-skey"


int64_t hook(uint32_t reserved)
{
    TRACESTR("rewardHook.c: started.");

    // 1) Identify hooking account
    uint8_t hook_accid[20];
    // Must cast pointers for Hooks API
    hook_account((uint32_t)hook_accid, (uint32_t)20);

    // 2) Check if this is an incoming Payment by comparing sfDestination
    uint8_t dest_accid[20];
    int64_t dlen = otxn_field((uint32_t)dest_accid, (uint32_t)20, sfDestination);
    if (dlen < 20)
        DONE("reward: ignoring non-Payment or missing Destination");

    // Are we the destination?
    int incoming = BUFFER_EQUAL_20(hook_accid, dest_accid);
    if (!incoming)
        DONE("reward: ignoring tx not incoming to me");

    //3) Fetch sfAmount
    uint8_t amount_buf[48];
    int64_t amount_len = otxn_field((uint32_t)amount_buf, (uint32_t)48, sfAmount);
    if (amount_len < 0)
        rollback(SBUF("reward: cannot fetch sfAmount"), 10);

    //If length == 8 => native token => skip
    if (amount_len == 8)
        DONE("reward: ignoring native token");

    // 4) Confirm currency == XAH
    uint8_t xah_code[20] = {
        0,0,0,0,0,0,0,0,
        0,0,0,0,
        'X','A','H',
        0,0,0,0,0
    };
    if (!BUFFER_EQUAL_20(amount_buf + CURRENCY_OFFSET, xah_code))
        DONE("reward: ignoring non-XAH payment");

    //5) Convert to Hook float
    int64_t oslot = otxn_slot(0);
    if (oslot < 0)
        rollback(SBUF("reward: could not slot transaction"), 20);

    int64_t amt_slot = slot_subfield(oslot, sfAmount, 0);
    if (amt_slot < 0)
        rollback(SBUF("reward: could not slot sfAmount"), 21);

    int64_t amount_xfl = slot_float(amt_slot);
    if (float_compare(amount_xfl, 0, COMPARE_LESS | COMPARE_EQUAL) == 1)
        rollback(SBUF("reward: invalid or zero amount"), 22);

    // 6) Compute half
    // The official float_set(...) signature is float_set(int32_t exponent, int64_t mantissa).
    // If we want to represent '2.0', we do float_set(0, 2).
    int64_t half_xfl = float_div(amount_xfl, float_set(0, 2));

    // 7) Reserve for 1 emitted transaction
    etxn_reserve(1);

    // 8) Prepare the new Payment (txn[283]):

    // 8a) ledger seq range
    uint32_t fls = (uint32_t)ledger_seq() + 1;
    *((uint32_t *)(FLS_OUT)) = FLIP_ENDIAN(fls);
    uint32_t lls = fls + 4;
    *((uint32_t *)(LLS_OUT)) = FLIP_ENDIAN(lls);

    // 8b) set hooking account as sfAccount
    __builtin_memcpy(HOOK_ACC, hook_accid, 20);

    // 8c) set forward address as sfDestination
    uint8_t forward_accid[20];
    int64_t ret = util_accid(
        (uint32_t)forward_accid, (uint32_t)20,
        (uint32_t)XAH_FORWARD_ACT, (uint32_t)(sizeof(XAH_FORWARD_ACT)-1)
    );
    if (ret < 0)
        rollback(SBUF("reward: could not parse forward rAddress"), 23);

    __builtin_memcpy(OTX_ACC, forward_accid, 20);

    // 8d) store half_xfl in the 49-byte Amount field
    float_sto(
        (uint32_t)AMOUNT_OUT,  // pointer
        (uint32_t)49,          // length
        (uint32_t)(amount_buf + 8),   // issuer (20 bytes)
        (uint32_t)20,
        (uint32_t)(amount_buf + 28),  // currency (20 bytes)
        (uint32_t)20,
        half_xfl,
        sfAmount
    );

    // 8e) If there's a SourceTag => copy it to DestinationTag
    int64_t srctag_len = otxn_field((uint32_t)DTAG_OUT, (uint32_t)4, sfSourceTag);
    if (srctag_len == 4)
        *(DTAG_OUT - 1) = 0x2EU; // from original code

    // 8f) Fee
    {
        int64_t fee = etxn_fee_base((uint32_t)txn, (uint32_t)283);
        uint8_t *b = FEE_OUT;
        *b++ = (uint8_t)(0b01000000 + ((fee >> 56) & 0x3F));
        *b++ = (uint8_t)((fee >> 48) & 0xFF);
        *b++ = (uint8_t)((fee >> 40) & 0xFF);
        *b++ = (uint8_t)((fee >> 32) & 0xFF);
        *b++ = (uint8_t)((fee >> 24) & 0xFF);
        *b++ = (uint8_t)((fee >> 16) & 0xFF);
        *b++ = (uint8_t)((fee >>  8) & 0xFF);
        *b++ = (uint8_t)( fee        & 0xFF);
    }

    TRACEHEX(SBUF(txn)); // optional: logs the hex of txn

    // 9) Emit
    uint8_t emithash[32];
    int64_t emit_result = emit(
        (uint32_t)emithash, (uint32_t)32,
        (uint32_t)txn,      (uint32_t)283
    );
    if (emit_result <= 0)
        rollback(SBUF("reward: emit() failure"), 30);

    // 10) Accept => original Payment is not overridden
    accept(SBUF("rewardHook: Emitted 50% XAH Payment"), 0);
    _g(1,1);
    return 0; // unreachable
}
