pragma solidity ^0.4.8;

import "./std/Mortal.sol";

contract IProject is Mortal {

    enum States {
      AcceptingFunds,
      Refunding
    }

  /**
   * Notify any listeners that this project has been
   * contributed to
   */
  event ContribEvent();

  /**
   * Notify any listeners that this project has been funded
   */
  event FundedEvent();

  /**
   * Notify any listeners that this project has been refunded
   */
  event RefundEvent();

  function withdraw(address _contributor) public {}
  function getContributorList() public returns(address[]){}
  function testRefund() {} // see README file - this is for testing purposes

  /**
   * The following three functions and
   * struct are project requirements
   */

  function fund(address _contributor) payable returns (bool) {}
  function payout() internal {}
  function refund() internal {}

  struct ProjectData {
    address projectOwner; // address of project owner
    uint targetAmount;    // amount to be raised
    uint deadline;        // deadline - contributing beyond this time causes a refund
  }

  ProjectData public projectData; // projectOwner, targetAmount and deadline
}
