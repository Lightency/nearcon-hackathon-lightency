use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use serde::{Serialize,Deserialize};
use near_sdk::{env, near_bindgen};


// VOTE
// Vote structor 
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
#[derive(Serialize,Deserialize)]
 pub struct Vote{
    pub address: String,
    pub vote:u8,
    pub time_of_vote:u64,
 }

 // Vote implementation 
 impl Vote {
    pub fn new() -> Self{
        Self {
            address: String::new(),
            vote:0,
            time_of_vote:0,
        }
    }
 }


// PROPOSAL
// Proposal structor 
#[derive(BorshDeserialize, BorshSerialize, Clone, Debug)]
#[derive(Serialize,Deserialize)]
pub struct Proposal{
    pub proposal_type:u8,
    pub proposal_title: String,
    pub description: String,
    pub amount: u128,
    pub proposal_creator: String,
    pub beneficiary: String,
    pub votes_for: u32,
    pub votes_against: u32,
    pub time_of_creation:u64,
    pub duration_days:u64,
    pub duration_hours:u64,
    pub duration_min:u64,
    pub list_voters:Vec<String>,
    pub votes:Vec<Vote>,
}

// Proposal implementation
impl Proposal {
    pub fn new() -> Self{
        Self {
            proposal_type: 0,
            proposal_title: String::new(),
            description: String::new(),
            amount: 0,
            proposal_creator: String::new(),
            beneficiary:String::new(),
            votes_for: 0,
            votes_against: 0,
            time_of_creation:0,
            duration_days:0,
            duration_hours:0,
            duration_min:0,
            list_voters:Vec::new(),
            votes:Vec::new(),
        }
    }

    pub fn create_vote(&mut self, vote:u8) -> Self{
        for i in self.list_voters.clone(){
            assert!(
                env::signer_account_id().to_string() != i,
                "You already voted"
            );
        }
        let v = Vote{
            address: env::signer_account_id().to_string(),
            vote:vote,
            time_of_vote:env::block_timestamp(),
        };
        self.votes.push(v);
        if vote==0 {
            self.votes_against=self.votes_against+1;
        }else{
            self.votes_for=self.votes_for+1;
        }
        self.list_voters.push(env::signer_account_id().to_string());
        Self { 
            proposal_type: self.proposal_type.clone(),
            proposal_title: self.proposal_title.clone(), 
            description: self.description.clone(),
            amount: self.amount,
            proposal_creator: self.proposal_creator.clone(),
            beneficiary: self.beneficiary.clone(),
            votes_for: self.votes_for, 
            votes_against: self.votes_against, 
            time_of_creation: self.time_of_creation, 
            duration_days: self.duration_days, 
            duration_hours: self.duration_hours, 
            duration_min: self.duration_min, 
            list_voters: self.list_voters.clone(),
            votes: self.votes.clone() 
        }
    }

    pub fn end_time(&self) -> u64 {
        self.time_of_creation+(self.duration_days*86400000000+self.duration_hours*3600000000+self.duration_min*60000000)
    }

    pub fn check_proposal(&self)->bool{
        if env::block_timestamp() > self.end_time() {
            return true;
        }
        return false;
    }
}

// Define the contract structure
#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct DaoCreationContract {
    records: Vec<Proposal>,
}

// Define the default, which automatically initializes the contract
impl Default for DaoCreationContract {
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
impl DaoCreationContract {
    #[init]
    pub fn new() -> Self {
        assert!(env::state_read::<Self>().is_none(), "Already initialized");
        Self {
            records: Vec::new(),
        }
    }

    // delete all daos
    pub fn delete_all(&mut self){
        assert_self();
        for _i in 0..self.records.len(){
            self.records.pop();
        }
    }

    // Methods.
    pub fn create_proposal (
        &mut self,
        proposal_type:u8,
        proposal_title: String,
        description: String,
        amount:u128,
        beneficiary:String,
        duration_days:u64,
        duration_hours:u64,
        duration_min:u64
    ){
            let proposal=Proposal{
                proposal_type:proposal_type,
                proposal_title: proposal_title,
                description: description,
                amount: amount,
                proposal_creator: env::signer_account_id().to_string(),
                beneficiary: beneficiary,
                votes_for: 0,
                votes_against: 0,
                time_of_creation:env::block_timestamp(),
                duration_days:duration_days,
                duration_hours:duration_hours,
                duration_min:duration_min,
                list_voters:Vec::new(),
                votes:Vec::new()
            };
            self.records.push(proposal);
    }

    pub fn get_proposals(&self) -> Vec<Proposal>{
        self.records.clone()
    }

    pub fn get_specific_proposal(&self, proposal_title: String) -> Proposal{
        let mut proposal= Proposal::new();
        for i in 0..self.records.len() {
            match self.records.get(i){
                Some(p) => if p.proposal_title==proposal_title {
                    proposal=p.clone();
                },
            None => panic!("There is no PROPOSALs"),
            }
        }
        proposal
    }

    pub fn replace_proposal(&mut self, proposal: Proposal){
        let mut index =0;
        for i in 0..self.records.len(){
            match self.records.get(i){
                Some(p) => if p.proposal_title==proposal.proposal_title {
                    index=i;
                },
                None => panic!("There is no PROPOSALs"),
            }
        }
        self.records.swap_remove(index);
        self.records.insert(index, proposal);
    }

    //get the end time of a specific proposal
    pub fn get_end_time(&self,proposal_name: String) -> u64 {
        let proposal=self.get_specific_proposal(proposal_name);
        proposal.end_time()
    }

    // add a vote 
    pub fn add_vote(
        &mut self,
        proposal_title: String,
        vote: u8
    ){
        let proposal =self.get_specific_proposal(proposal_title).create_vote(vote);
        self.replace_proposal(proposal);
    }

    // get votes for 
    pub fn get_votes_for(&self,proposal_title: String) -> u32 {
        let proposal= self.get_specific_proposal(proposal_title);
        proposal.votes_for
    }

    // get votes against 
    pub fn get_votes_against(&self,proposal_title: String) -> u32 {
        let proposal= self.get_specific_proposal(proposal_title);
        proposal.votes_against
    }

    // get number of votes 
    pub fn get_nember_votes(&self,proposal_title: String) -> u32{
        let proposal= self.get_specific_proposal(proposal_title);
        proposal.votes_against + proposal.votes_for
    }

    // check the proposal and return a message
    pub fn check_the_proposal(&self,proposal_title: String) -> String{
        let proposal=self.get_specific_proposal( proposal_title);
        let check= proposal.check_proposal();
        if check==true {
            if proposal.votes_for > proposal.votes_against {
                let msg="Time of proposal is up, Proposal accepted".to_string();
                msg
            }else {
                let msg="Time of proposal is up, Proposal refused".to_string();
                msg
            }
        }else{
            let msg="Proposal is not over yet".to_string();
            msg
        }
    }

}
