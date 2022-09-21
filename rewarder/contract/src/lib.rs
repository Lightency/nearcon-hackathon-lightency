use near_sdk::{ext_contract, PromiseOrValue};
use serde::{Serialize, Deserialize};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{log, env, near_bindgen, AccountId, Gas, Promise, PromiseError, PanicOnDefault};
use near_sdk::collections::{Vector, UnorderedMap};

#[derive(BorshDeserialize, BorshSerialize)]
#[derive(Serialize,Deserialize)]
pub struct Data {
    amount:u128,
    time:u64,
}

#[ext_contract(ext_ft)]
pub trait Rewardpool {
    #[payable]
    fn pay(&mut self, amount: u128, to: String);
}

#[ext_contract(ext_stakingpool)]
pub trait Stakingpool {
    fn get_data(&self, account:String) -> Vec<Data>;
    fn get_totalstaked(&self) -> Promise;
    fn check_staker(&self,account:String) -> Promise;
}

#[ext_contract(this_contract)]
trait Callbacks {
    fn get_data_callback(&self) -> Data;
    fn staking_pool_supply_callback(&self) -> u128;
    fn check_staker_callback(&self, accountid:String) -> bool;
}

// Define the contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Rewardercontract {
    redeemers:UnorderedMap<String,u64>,
    stakers:UnorderedMap<String,bool>,
    staking_pool_supply:UnorderedMap<String,u128>,
    result1: bool,
}

impl Default for Rewardercontract {
    fn default() -> Self {
        panic!("Contract is not initialized yet")
    }
}

// Implement the Rewardercontract structure
#[near_bindgen]
impl Rewardercontract {
    #[init]
    pub fn new() -> Self {
        assert!(env::state_read::<Self>().is_none(), "Already initialized");
        Self {
            redeemers: UnorderedMap::new(b"m"),
            stakers: UnorderedMap::new(b"n"),
            staking_pool_supply: UnorderedMap::new(b"c"),
            result1:false,
        }
    }

    pub fn redeem(&mut self){
        if self.redeemers.get(&env::signer_account_id().to_string()).is_none() {
            self.redeemers.insert(&env::signer_account_id().to_string(),&env::block_timestamp());
        }
    }

    pub fn get_data_staker(&self, account:String) -> Promise{
        let contract = "lightencypool.testnet".to_string().try_into().unwrap();
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = ext_stakingpool::ext(contract)
          .with_static_gas(Gas(5*1000000000000))
          .get_data(account);
        
        return promise.then( // Create a promise to callback query_greeting_callback
          Self::ext(env::current_account_id())
          .with_static_gas(Gas(5*1000000000000))
          .query_data_staker_callback()
        )
      }
    
        
    #[private]// Public - but only callable by env::current_account_id()
    pub fn query_data_staker_callback(&self, #[callback_result] call_result: Result<Vec<Data>, PromiseError>) -> Vec<Data> {
    // Check if the promise succeeded by calling the method outlined in external.rs
    if call_result.is_err() {
        panic!("There was an error contacting stakingpool contract");
    }
    
    // Return the greeting
    let data: Vec<Data> = call_result.unwrap();
    data
    }

    // ******Get Staking Pool Supply*****//

    pub fn get_staking_pool_supply(&self) -> Promise {
        let account = "lightencypool.testnet".to_string().try_into().unwrap();
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = ext_stakingpool::ext(account)
          .with_static_gas(Gas(5*1000000000000))
          .get_totalstaked();
        
        return promise.then( // Create a promise to callback query_greeting_callback
          Self::ext(env::current_account_id())
          .with_static_gas(Gas(5*1000000000000))
          .staking_pool_supply_callback()
        )
    }

    #[private] // Public - but only callable by env::current_account_id()
    pub fn staking_pool_supply_callback(&mut self, #[callback_result] call_result: Result<u128, PromiseError>) -> u128 {
    // Check if the promise succeeded by calling the method outlined in external.rs
    if call_result.is_err() {
        log!("There was an error contacting Hello NEAR");
        return 0;
    }

    // Return the greeting
    let result: u128 = call_result.unwrap();
        self.staking_pool_supply.insert(&"staking_pool_supply".to_string(),&result);
        env::log_str(&self.staking_pool_supply.get(&"staking_pool_supply".to_string()).unwrap().to_string());
    result
    }

    // ****** CHECK STAKER*****//

    pub fn get_check_staker(&self, accountid:&String) -> Promise {
        let account = "lightencypool.testnet".to_string().try_into().unwrap();
        
        // Create a promise to call HelloNEAR.get_greeting()
        let promise = ext_stakingpool::ext(account)
          .with_static_gas(Gas(5*1000000000000))
          .check_staker(accountid.to_string());
          //let account2=accountid;
        
        return promise.then(
            Self::ext(env::current_account_id())
            .with_static_gas(Gas(5*1000000000000))
            .check_staker_callback(&accountid))
    }

    //Public - but only callable by env::current_account_id()
     pub fn check_staker_callback(&mut self, #[callback_result] call_result: Result<bool, PromiseError>, accountid:&String) -> bool {
     //Check if the promise succeeded by calling the method outlined in external.rs
     if call_result.is_err() {
        log!("There was an error contacting lightencypool.testnet contract");
         return false;
     }

     //Return the greeting
     let result = call_result.unwrap();
     self.stakers.insert(&accountid.to_string(),&result);
     env::log_str(&self.stakers.get(accountid).unwrap().to_string());
     result
     }



    pub fn send_reward(&self ,amount:u128 , to:String){
        let account = "lightencyrewardpool.testnet".to_string().try_into().unwrap();
        ext_ft::ext(account)
            .with_static_gas(Gas(5 * 1000000000000))
            .pay(amount,to);
    }

    pub fn stake_test(&self, accountid:String) -> bool{
        return self.stakers.get(&accountid).unwrap()
    }

    pub fn pay (&mut self){
        if self.redeemers.get(&env::signer_account_id().to_string()).is_some(){
                self.send_reward(1000000000000000000000000, env::signer_account_id().to_string());
                self.redeemers.remove(&env::signer_account_id().to_string());
        }
    }

}

