pragma solidity ^0.4.8;

import "./IProject.sol";

// This is a project that may be funded through the hub

contract Project is IProject {

  /**
   * don't bother if the amount is 0
   * it would just create a bogus contributor
   */
  modifier nonZeroModifier() {
    if (msg.value == 0) {
      return;
    }
    _;
  }

  /**
   * don't accept funds past the deadline
   */
  modifier refundIfPastDeadline() {
    if (now > projectData.deadline) {
      // no need to explicitly refund the 'after-deadline'
      // sender as payable function is not called.
      refund();
      return;
    }
    _;
  }

  /**
   * generic modifier to check state
   */
  modifier inState(States _state) {
      if (state != _state) throw;
      _;
  }
  
  /**
   * allow only the owner to invoke the function
   */
   modifier ownerOnly() {
     if(msg.sender !=  projectData.projectOwner) throw;
     _;
   }

  States public state = States.AcceptingFunds; 
  
  mapping(address => uint) public contributorBalance; // balances are tracked, rather than contributions
  address[] contributors; // keep a list of contributors as the keys of the hash cannot be listed

  /**
   * returns a list of all contributors
   * can be used by client to see which accounts should seek a refund
   *
   * @return a list of all of all contributors to this project
   */
  function getContributorList() public returns(address[]){
    return contributors;
  }

  /**
   * @param _owner the address to which funds from this project
   *               shall be sent if successfully
   * @param _target the target amount to be raised
   * @param _deadline the date by which funds must be raised to
   *                  avoid a refund (could be checked against 'now')
   */
  function Project(address _owner, uint _target, uint _deadline) {
    projectData = ProjectData(_owner, _target, _deadline);
  }

  /**
   * Contribute to this project and attribute the contribution to the sender
   *
   *  @param _sender the address of the sender that called the funding hub
   */
  function fund(address _sender) payable nonZeroModifier refundIfPastDeadline inState(States.AcceptingFunds) returns(bool){
    // for new contributors
    if(contributorBalance[_sender] == 0){ // no existing balance for this contributor
      contributors.push(_sender); // add to the array of contributors
      contributorBalance[_sender] = 0; // initialise balance to zero
    }

    if(this.balance > projectData.targetAmount) {
    // full amount reached - return the excess to the original sender
      uint excess = this.balance - projectData.targetAmount;
      contributorBalance[_sender] -= excess;

      // external call is last thing before payout (selfdestruct)
      bool retVal = _sender.send(excess);
      if (!(retVal)) { throw; }
      return payout();
    } else if (this.balance < projectData.targetAmount) {
      contributorBalance[_sender] += msg.value;
      ContribEvent(); // only send event here. payout() sends FundedEvent
      return true;
    } else { // target reached with no excess
      return payout();
    }
  }

  /**
   * Payout the funds to the owner and kill this project.
   */
  function payout() internal returns (bool){
    FundedEvent();
    selfdestruct(projectData.projectOwner); // There are other options - this seems like the cleanest
    return true; // kinda pointless
  }

  /**
   * Make all funds available to their contributor
   * and notify contributors that they can withdraw now
   */
  function refund() ownerOnly {
    state = States.Refunding;
    RefundEvent();
  }

  /**
   * This allows a contributor to retrieve their funds if the 
   * project is in the refunding state
   *
   *  @param _contributor the address of the contributor to return the funds to 
   */
  function withdraw(address _contributor) public inState(States.Refunding) {
    if(contributorBalance[_contributor] == 0) return;

    uint tmpBalance = contributorBalance[_contributor];

    // deduct from balance before trying to send
    // Checks, Effects, Interactions principle
    contributorBalance[_contributor] = 0;

    if(!_contributor.send(tmpBalance)) throw;

    if(this.balance == 0) selfdestruct;
  }
}
