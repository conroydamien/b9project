pragma solidity ^0.4.2;

import "./IProject.sol";
import "./Project.sol";
import "./ProjectSetManager.sol";
import "./std/Mortal.sol";

// This is the hub for the creation of and
// contribution to funding projects

contract FundingHub is Mortal {

  // delegated to for management of the set of projects
  ProjectSetManager.ProjectSet projSet;

  /**
   * Fired if a new project is created on this hub
   */
  event NewProjectEvent(
      address newProject
  );

 /**
  * @return a list of all projects attached to this hub
  */
  function allProjects() public returns (IProject[]) {
    return projSet.projects;
  }

  /**
   * @param _project The project to be checked for active status
   * @return true if the project is active, false otherwise
   */
  function isActive(IProject _project) public returns (bool){
    return ProjectSetManager.isActive(projSet, _project);
  }

  /**
   * Returns a new IProject implementation
   *
   * @param _owner The address of the account to which funds will
   *                be released.
   * @param _target The amount to be raised.
   * @param _deadline If the target is not hit by deadline then refund
   * @return the address of the contract for the project created.
   */
	function createProject(address _owner, uint _target, uint _deadline) public returns (IProject){
    IProject project = new Project(_owner, _target, _deadline);
    ProjectSetManager.add(projSet, project);
    NewProjectEvent(project);
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
     // however, we must fund the project before checking its balance

      if (_recipient.balance == 0) { // it's been funded or refunded
        ProjectSetManager.tagAsInactive(projSet, _recipient);
      }
  	}
    // provide a return value to check success??
	}
}
