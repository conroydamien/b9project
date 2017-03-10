pragma solidity ^0.4.2;

import "./IProject.sol";
import "./Project.sol";
import "./ProjectSetManager.sol";
import "./std/Mortal.sol";

// This is the hub for the creation of and
// contribution to funding projects

contract FundingHub is Mortal {

  ProjectSetManager.ProjectSet projSet;

  /**
   * may be used for debugging
   */
  event DebugEvent(
     string message,
     address recipient
  );

  event DebugIntEvent(
      string message,
      uint value
  );

  /**
   * @return the number of projects attached to this hub
   */
  function numberOfProjects() public returns (uint){
    return ProjectSetManager.length(projSet);
	}

  function isActive(IProject project) public returns (bool){
    return ProjectSetManager.isActive(projSet, project);
  }

  /**
   * Returns a project given its index in the array.
   *
   * @param _index the index of the project in 'projects'
   * @return the project at that index.
   */
  function getProjectListElement(uint _index) returns (IProject){
    return ProjectSetManager.get(projSet, _index);
  }

  /**
   * Returns a new IProject implementation
   *
   * param _owner The address of the account to which funds will
   *                be released.
   * return the address of the contract for the project created.
   */
	function createProject(address _owner, uint _target, uint _deadline) public returns (IProject){
    IProject project = new Project(_owner, _target, _deadline);
    ProjectSetManager.add(projSet, project);
		return project; // not visible from Truffle as tx_id is returned
	}

  /**
   * Contributes the amount payable to the project specified.
   *
   * @param _recipient The project to which the amount will be contributed.
   */
	function contribute(IProject _recipient) payable {

    address contributor = msg.sender;
    uint contribution = msg.value;

    if(isActive(_recipient)) { // don't pay if there's no project
      _recipient.fund.value(contribution)(contributor);

     // typically the external call should be the last call (CIE principle)
     // however, we must fund the project before checking the balance

      if (_recipient.balance == 0) { // it's been funded or refunded
        ProjectSetManager.tagAsInactive(projSet, _recipient);
      }
  	}
    // provide a return value to check success??
	}
}
