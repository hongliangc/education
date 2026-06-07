export class RewardDomainError extends Error {
  readonly code: string;

  constructor(code: string, message = code) {
    super(message);
    this.code = code;
    this.name = new.target.name;
  }
}

export class InsufficientStarsError extends RewardDomainError {
  readonly needed: number;

  constructor(needed: number) {
    super("insufficient_stars");
    this.needed = needed;
  }
}

export class OutOfStockError extends RewardDomainError {
  constructor() {
    super("out_of_stock");
  }
}

export class PreviousChapterRequiredError extends RewardDomainError {
  constructor() {
    super("previous_chapter_required");
  }
}

export class RewardResourceUnavailableError extends RewardDomainError {
  constructor() {
    super("resource_unavailable");
  }
}

export class RewardAccessDeniedError extends RewardDomainError {
  constructor() {
    super("reward_access_denied");
  }
}

export class RedemptionNotFoundError extends RewardDomainError {
  constructor() {
    super("redemption_not_found");
  }
}

export class InvalidRedemptionStateError extends RewardDomainError {
  readonly status: string;

  constructor(status: string) {
    super("invalid_redemption_state");
    this.status = status;
  }
}

export class InvalidRewardInputError extends RewardDomainError {
  constructor(message: string) {
    super("invalid_reward_input", message);
  }
}
