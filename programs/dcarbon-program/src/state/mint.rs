use anchor_lang::prelude::*;

#[account]
pub struct MintPda {
    pub bump: u8,
}

impl MintPda {
    pub const SEED_PREFIX: &[u8] = b"mint";
}
