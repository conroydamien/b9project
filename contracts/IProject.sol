pragma solidity ^0.4.2;

import "./std/Mortal.sol";

contract IProject is Mortal {

	/**
	 * Notify any listeners that this project has been
	 * contributed to
	 */
	event ContribEvent(
	);

	/**
	 * Notify any listeners that this project has been deactivated
	 */
	event DeactivateEvent(
	);

  /**
	 * The following four functions and
	 * struct are project requirements
	 */

	function fund(address _address) public payable {}
	function payout() internal {}
	function refund() public {} // public for testing purposes

	struct ProjectData {
		address projectOwner; // address of project owner
		uint targetAmount;    // amount to be raised
		uint deadline;        // deadline - can't contribute beyond this time
	}

	ProjectData public projectData; // projectOwner, targetAmount and deadline
}
