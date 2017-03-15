pragma solidity ^0.4.2;

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
    }
    _;
	}

	mapping(address => uint) public contributorBalance; // balances are tracked, rather than contributions
	address[] contributors; // keep a list of contributors as the keys of the hash cannot be listed

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
		    bool retVal = _sender.send(excess);
        if (!(retVal)) { throw; }
        // may break principle of calling external function last
        // however, contributor balance shouldn't be reduced
        // if refund of the excess fails
			  contributorBalance[_sender] -= excess;
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
    DeactivateEvent("payout");
		selfdestruct(projectData.projectOwner); // There are other options - this seems like the cleanest
	}

  /**
	 * Refund all funds to the correct contributor
	 * and kill this project.
   *
   * TODO: This function is public for testing purposes
   * because triggering a refund via the deadline in the
   * tests was very difficult, in production it should be internal
	 */
	function refund() public {
    if(this.balance > 0) {
      address contributor;
      bool retVal;
			for(uint i = 0; i < contributors.length; ++i) {
				contributor = contributors[i];
				retVal = contributor.send(contributorBalance[contributor]);
				if (!(retVal)) { throw; }
			}
		}
    DeactivateEvent("refund");
		selfdestruct(projectData.projectOwner);
	}
}
