export type RewardOwnerType = "PLATFORM" | "FAMILY";

export type RewardResourceType =
  | "STORY_CHAPTER"
  | "STORY_TALE"
  | "VIDEO"
  | "REWARD";

export type RewardRedemptionStatus =
  | "COMPLETED"
  | "PENDING_FULFILLMENT"
  | "FULFILLED"
  | "REJECTED_REFUNDED";

export type StarLedgerReason =
  | "SESSION_EARN"
  | "REDEMPTION"
  | "REFUND"
  | "OPENING_BALANCE"
  | "ADMIN_ADJUST";
