use anchor_lang::prelude::*;

use instructions::*;
use state::*;
use util::*;

mod instructions;
mod state;
mod util;

declare_id!("AVABwP8V51iBGJhrJrWLEgUEQhWsQtt8U7yaekBHStQu");

#[program]
pub mod dcarbon_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        initialize_handle(ctx, params)?;
        Ok(())
    }

    pub fn mint_token(ctx: Context<MintToken>, params: MintTokenParams) -> Result<()> {
        mint_token_handle(ctx, params)?;
        Ok(())
    }

    pub fn add_devices(ctx: Context<AddDevices>, params: AddDevicesParams) -> Result<()> {
        add_devices_handle(ctx, params)?;
        Ok(())
    }

    pub fn withdraw_fee(ctx: Context<WithdrawFee>, params: WithdrawFeeParams) -> Result<()> {
        withdraw_fee_handle(ctx, params)?;
        Ok(())
    }

    pub fn enable_device(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
        enable_device_handle(ctx, params)?;
        Ok(())
    }

    pub fn suspend_device(ctx: Context<UpdateConfig>, params: UpdateConfigParams) -> Result<()> {
        suspend_device_handle(ctx, params)?;
        Ok(())
    }
    pub fn set_limit(ctx: Context<UpdateConfig>, params: SetLimitParams) -> Result<()> {
        set_limit_handle(ctx, params)?;
        Ok(())
    }
}
