use std::convert::TryInto;

//100000000 = 1 LTS
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, AccountId, Gas, PanicOnDefault, Promise, PromiseError};
use near_sdk::json_types::U128;
use near_sdk::{ext_contract, serde,PromiseOrValue};
use serde::Serialize;

// Define the contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct FundsManager {
    near_balance: u128,
    lts_balance: u128,
    stable_coin_balance: u128,
}

#[ext_contract(ext_lts)]
pub trait lighttoken {
    fn mint_token(&mut self, account_id: AccountId, amount: u128);
    fn burn_token(&mut self, account_id: AccountId, amount: u128);
    fn ft_transfer(&mut self,receiver_id:String,amount:String,memo:String);
    fn ft_total_supply(&self) -> u128;
}

#[ext_contract(ext_wrap)]
pub trait SwapNearToWnear {
    fn near_deposit (&mut self);
    fn ft_transfer_call(&mut self, receiver_id: AccountId, amount: String, msg: String);
}

// #[ext_contract(ext_ft)]
// pub trait SwapNear {
//     fn ft_transfer_call(&mut self, receiver_id: AccountId, amount: String, msg: String);
// }


// Define the default, which automatically initializes the contract
impl Default for FundsManager {
    fn default() -> Self {
        panic!("Contract is not initialized yet")
    }
}

// Make sure that the caller of the function is the owner
fn assert_self() {
    assert_eq!(
        env::current_account_id(),
        env::predecessor_account_id(),
        "Can only be called by owner"
    );
}

// Implement the contract structure
// To be implemented in the front end
#[near_bindgen]
impl FundsManager {
    #[init]
    pub fn new() -> Self {
        assert!(env::state_read::<Self>().is_none(), "Already initialized");
        Self {
            near_balance: 0,
            lts_balance: 0,
            stable_coin_balance: 0,
        }
    }

    pub fn get_total_supply(&self) -> PromiseOrValue<u128> {
        let account = "light-token.testnet".to_string().try_into().unwrap();
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = ext_lts::ext(account)
          .with_static_gas(Gas(5*1000000000000))
          .ft_total_supply();
          PromiseOrValue::from(promise)
    }

    #[payable]
    pub fn swap_near_wnear (&mut self,amount:u128) {
        let contract_account = "wrap.testnet".to_string().try_into().unwrap();

        ext_wrap::ext(contract_account)
            .with_attached_deposit(amount * 1000000000000000000000000)
            .with_static_gas(Gas(5_000_000_000_000))
            .near_deposit();
    }

    // pub fn check_balance(&mut self, account:String) -> PromiseOrValue<u128> {
    //     let contract_account = "wrap.testnet".to_string().try_into().unwrap();
    //     let promise = ext_wrap::ext(contract_account)
    //     .with_static_gas(Gas(5_000_000_000_000))
    //     .ft_balance_of(account.to_string().try_into().unwrap());
    //     PromiseOrValue::from(promise)
    // }

    #[payable]
    // pub fn swap(&mut self, amount: String, msg: String) {
    //     let contract_account = "wrap.testnet".to_string().try_into().unwrap();
    //     let ref_account = "ref-finance-101.testnet".to_string().try_into().unwrap();

    //     ext_ft::ext(contract_account)
    //         .with_attached_deposit(1)
    //         .with_static_gas(Gas(5_000_000_000_000))
    //         .ft_transfer_call(ref_account, amount, msg);
    // }

    #[payable]
    pub fn swap(&mut self, amount: u128, msg: String) {
        let ref_account = "ref-finance-101.testnet".to_string().try_into().unwrap();
        ext_wrap::ext("wrap.testnet".to_string().try_into().unwrap())
            .with_attached_deposit(amount * 1000000000000000000000000)
            .with_static_gas(Gas(5_000_000_000_000))
            .near_deposit()
            .then(
                ext_wrap::ext("wrap.testnet".to_string().try_into().unwrap())
            .with_attached_deposit(1)
            .with_static_gas(Gas(5_000_000_000_000))
            .ft_transfer_call(ref_account, (amount * 1000000000000000000000000).to_string(), msg),
        );
    }

    pub fn mint_lts(&mut self, amount: u128) {
        let contract_account = "light-token.testnet".to_string().try_into().unwrap();
        ext_lts::ext(contract_account)
            .with_static_gas(Gas(5_000_000_000_000))
            .mint_token(env::signer_account_id(), amount);
    }

    pub fn burn_lts(&mut self, amount: u128) {
        let contract_account = "light-token.testnet".to_string().try_into().unwrap();

        ext_lts::ext(contract_account)
            .with_static_gas(Gas(5_000_000_000_000))
            .burn_token(env::signer_account_id(), amount);
    }

    pub fn transfer_lts(&mut self, amount: u128) {
        let contract_account = "light-token.testnet".to_string().try_into().unwrap();

        ext_lts::ext(contract_account)
            .with_attached_deposit(1)
            .with_static_gas(Gas(5_000_000_000_000))
            .ft_transfer("lightencytreasury.testnet".to_string().try_into().unwrap(), amount.to_string(),"".to_string());
    }

    pub fn from_stcoin_lts (&self, supply:u128 , s:u128) -> u128{
        let sup= supply as f64;
        let stablecoin= s as f64;
        let c1= 0.000004;
        let c2= -1200000 as f64;
        let expo1= (c1 * stablecoin).exp();
        let expo2= (c1 * (sup - c2)).exp();
        let ln1=(expo1 * (expo2 + 1.0) - 1.0).ln();
        let q1= (1.0/c1) * ln1 + c2;
        (q1 - sup) as u128
    }

}