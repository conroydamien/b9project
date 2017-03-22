pragma solidity ^0.4.8;

import "./IProject.sol";

// This is a project that may be funded through the hub

contract Project is IProject {

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
   * @param _contributor the address of the contributor that called the funding hub
   */
  function fund(address _contributor) payable
              refundIfPastDeadline inState(States.AcceptingFunds) returns(bool) {

    //for new contributors
    if(contributorBalance[_contributor] == 0){ // no existing balance for this contributor
      contributors.push(_contributor); // add to the array of contributors
    }

    if(this.balance > projectData.targetAmount) {
    // full amount reached - return the excess to the original sender
      uint excess = this.balance - projectData.targetAmount;
      contributorBalance[_contributor] -= excess;

      // external call is last thing before payout (selfdestruct)
      if(!_contributor.send(excess)) throw;
      payout();
    }

    if(this.balance == projectData.targetAmount) {
      payout();
    }

    contributorBalance[_contributor] += msg.value;
    ContribEvent();

    return true;
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
