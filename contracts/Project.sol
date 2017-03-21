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
   * check if we're ready to refund
   */
   modifier inRefundState() {
     _;
   }

  mapping(address => uint) public contributorBalance; // balances are tracked, rather than contributions
  address[] contributors; // keep a list of contributors as the keys of the hash cannot be listed

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
  function fund(address _sender) payable nonZeroModifier refundIfPastDeadline {
    // for new contributors
    if(contributorBalance[_sender] == 0){ // no existing balance for this contributor
      contributors.push(_sender); // add to the array of contributors
      contributorBalance[_sender] = 0; // initialise balance to zero
    }

    if(this.balance > projectData.targetAmount) {
    // full amount reached - return the excess to the original sender
      uint excess = this.balance - projectData.targetAmount;
      contributorBalance[_sender] -= excess;

      // external call is last
      bool retVal = _sender.send(excess);
      if (!(retVal)) { throw; }
      payout();
    } else if (this.balance < projectData.targetAmount) {
      contributorBalance[_sender] += msg.value;
      ContribEvent(); // only send event here. payout() sends DeactivateEvent
    } else { // target reached with no excess
      payout();
    }
  }

  /**
   * Payout the funds to the owner and kill this project.
   */
  function payout() internal {
    FundedEvent();
    selfdestruct(projectData.projectOwner); // There are other options - this seems like the cleanest
  }

  /**
   * Make all funds available to their contributor
   * and notify contributors that they can withdraw now
   */
  function refund() internal {
    RefundEvent();
  }


  function withdraw(address _funder) public inRefundState {
    if(contributorBalance[_funder] == 0) return;

    uint tmpBalance = contributorBalance[_funder];

    // deduct from balance before trying to send
    // Checks, Effects, Interactions principle
    contributorBalance[_funder] = 0;

    if(!_funder.send(tmpBalance)) throw;

    if(this.balance == 0) selfdestruct;
  }
}
