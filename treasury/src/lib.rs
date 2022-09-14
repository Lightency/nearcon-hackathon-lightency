use std::convert::TryInto;
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::ext_contract;
use near_sdk::{env, near_bindgen, AccountId, Gas, Promise,PromiseOrValue};

// Define the contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct TreasuryContract {
    near_balance: u128,
    lts_balance: u128,
    //stable_coin_balance: u128,
}

#[ext_contract(ext_ft)]
pub trait lighttoken {
    fn ft_transfer(&mut self,receiver_id:String,amount:String,memo:String);
    fn ft_balance_of (&self, account_id:String) -> u128;
}

// Define the default, which automatically initializes the contract
impl Default for TreasuryContract {
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
impl TreasuryContract {
    #[init]
    pub fn new() -> Self {
        assert!(env::state_read::<Self>().is_none(), "Already initialized");
        Self {
            near_balance: 0,
            lts_balance:0, 
        }
    }

    pub fn set_near_balance (&mut self) {
        self.near_balance = env::account_balance();
    }

    pub fn get_near_balance (&self) -> u128 {
        let balance=env::account_balance();
        balance
    }

    // set_lts_balance

    // funtion that pay near to an account
    pub fn pay(&self, amount: u128, to: AccountId) -> Promise {
        Promise::new(to).transfer(amount*1000000000000000000000000)
    }

    pub fn deposit_crypto(&mut self, amount:u128) {
        self.pay(amount, "lightencyswap.testnet".to_string().try_into().unwrap());
        self.set_near_balance();
    }

    pub fn transfer_lts(&mut self, amount: u128) {
        let contract_account = "light-token.testnet".to_string().try_into().unwrap();

        ext_ft::ext(contract_account)
            .with_attached_deposit(1)
            .with_static_gas(Gas(5_000_000_000_000))
            .ft_transfer("lightencyswap.testnet".to_string().try_into().unwrap(), amount.to_string(),"".to_string());
    }
    
    pub fn get_lts_balance(&self) -> PromiseOrValue<u128> {
        let account = "light-token.testnet".to_string().try_into().unwrap();
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = ext_ft::ext(account)
          .with_static_gas(Gas(5*1000000000000))
          .ft_balance_of("lightencytreasury.testnet".to_string().try_into().unwrap());
          PromiseOrValue::from(promise)
    }

}



