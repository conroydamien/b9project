pragma solidity ^0.4.8;

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
   * Throw if a project is inactive
   */
  modifier onlyActiveProjects(IProject _project) {
    if(!isActive(_project)){
      throw;
    }
    _;
  }

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
   * @param _target The amount to be raised.
   * @param _deadline If the target is not hit by deadline then refund
   * @return the address of the contract for the project created.
   */
  function createProject(uint _target, uint _deadline) public returns (IProject){
    IProject project = new Project(msg.sender, _target, _deadline);
    ProjectSetManager.add(projSet, project);
    NewProjectEvent(project);
    return project; // not visible externally as tx_id is returned
  }

  /**
   * Contributes the amount payable to the project specified.
   *
   * @param _recipient The project to which the amount will be contributed.
   */
  function contribute(IProject _recipient) payable onlyActiveProjects(_recipient){
    var (owner, target, deadline) = _recipient.projectData();

    if(deadline < now || _recipient.balance + contribution >= target)
    {
      // we've passed the deadline or reached the target
      // the funding hub will not be dealing with this project anymore
      // after this contribution
      ProjectSetManager.tagAsInactive(projSet, _recipient);
    }

    // The external call should be the last call (Checks, Effects,
    // Interactions principle)
    if(!_recipient.fund.value(msg.value)(msg.sender)) throw;
  }
}
