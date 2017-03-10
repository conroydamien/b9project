pragma solidity ^0.4.2;

import "./std/Mortal.sol";

contract IProject is Mortal {

  /**
	 * project requirements for
	 * functions provided and struct
	 */

	function fund(address _address) public payable {}
	function payout() internal {}
	function refund() public {}
	function projectOwner() public returns(address) {}

	struct ProjectData {
		address projectOwner; // address of project owner
		uint targetAmount;    // amount to be raised
		uint deadline;        // deadline - can't contribute beyond this time
	}
}
