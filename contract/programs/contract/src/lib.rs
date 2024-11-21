use anchor_lang::prelude::*;

declare_id!("4H4vQ4cpasqGXu2GDnqdTRxhngBT2XT5HMwVp8t7ex6i");

#[program]
pub mod escrow_program {
    use super::*;

    pub fn create_payment(
        ctx: Context<CreatePayment>,
        amount: u64,
        merchant: Pubkey,
        client: Pubkey,
        metadata: String,
    ) -> Result<()> {
        // deriving pda from metadata
        let (pda, _bump) = Pubkey::find_program_address(&[metadata.as_bytes()], &ctx.program_id);

        // check pda is the same
        if ctx.accounts.payment_account.key() != pda {
            return Err(ErrorCode::InvalidPaymentAccount.into());
        }

        // already exists check (If the account is uninitialized, its owner is the System Program)
        if ctx.accounts.payment_account.to_account_info().owner != &System::id() {
            return Err(ErrorCode::PaymentAlreadyExists.into());
        }

        let payment_account = &mut ctx.accounts.payment_account;
        payment_account.amount = amount;
        payment_account.merchant = merchant;
        payment_account.client = client;
        payment_account.metadata = metadata.clone();
        payment_account.status = PaymentStatus::Pending;

        msg!("Created payment account with metadata: {}", metadata);
        Ok(())
    }

    pub fn update_payment(
        ctx: Context<UpdatePayment>,
        amount: u64,
        metadata: String,
    ) -> Result<()> {
        // deriving pda from metadata
        let (pda, _bump) = Pubkey::find_program_address(&[metadata.as_bytes()], &ctx.program_id);

        // check pda is the same
        if ctx.accounts.payment_account.key() != pda {
            return Err(ErrorCode::InvalidPaymentAccount.into());
        }

        // doesn't exist check (If the account is uninitialized, its owner is the System Program)
        if ctx.accounts.payment_account.to_account_info().owner == &System::id() {
            return Err(ErrorCode::PaymentNotFound.into());
        }

        // Update the existing payment account
        let payment_account = &mut ctx.accounts.payment_account;
        payment_account.status = PaymentStatus::Pending;

        msg!("Updated payment account with metadata: {}", metadata);
        Ok(())
    }
}

// ERROR HANDLING
#[error_code]
pub enum ErrorCode {
    #[msg("Payment already exists.")]
    PaymentAlreadyExists,
    #[msg("Payment not found.")]
    PaymentNotFound,
    #[msg("invalid input PDA")]
    InvalidPaymentAccount,
}

// STATE DEFINITIONS
#[account]
pub struct Payment {
    pub amount: u64,
    pub merchant: Pubkey,
    pub client: Pubkey,
    pub metadata: String,
    pub status: PaymentStatus,
}

impl Payment {
    // This function calculates the space required for the Payment account at runtime
    pub fn calculate_space(metadata_len: usize) -> usize {
        // 8 bytes for amount (u64)
        // 32 bytes for merchant (Pubkey)
        // 32 bytes for client (Pubkey)
        // 4 bytes for the length of the string (metadata)
        // The length of the metadata string itself
        // 1 byte for the status (PaymentStatus)
        8 + 32 + 32 + 4 + metadata_len + 1
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Canceled,
}

// CONTEXT STRUCTS FOR HANDLERS
#[derive(Accounts)]
#[instruction(metadata: String)]
pub struct CreatePayment<'info> {
    // one who triggered pays
    #[account(init, payer = signer, space = Payment::calculate_space(metadata.len()))]
    pub payment_account: Account<'info, Payment>,
    #[account(mut)]
    pub signer: Signer<'info>, // This is the account that will trigger the transaction
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePayment<'info> {
    #[account(mut)]
    pub payment_account: Account<'info, Payment>,
    pub signer: Signer<'info>,
}
