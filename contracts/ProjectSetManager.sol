pragma solidity ^0.4.2;

import "./IProject.sol";

library ProjectSetManager {

  struct ProjectSet {
    mapping(address => uint) projectMap; // set to 1 if project exists
    IProject[] projects;
//    IProject[] liveProjects;
  }

  function add(ProjectSet storage ps, IProject project) internal {
    ps.projectMap[project] = 1;
    ps.projects.push(project);
//    ps.liveProjects.push(project);
  }

  function tagAsInactive(ProjectSet storage ps, IProject project) internal {
    ps.projectMap[project] = 0;
//    ps.liveProjects = new IProject[](0);

//    for(uint i = 0; i < ps.projects.length; i++) {
//      if(ps.projectMap[ps.projects[i]] == 1) {
//        ps.liveProjects.push(ps.projects[i]);
//      }
//    }
  }

  function length(ProjectSet storage ps) internal returns (uint) {
    return ps.projects.length;
  }

  function isActive(ProjectSet storage ps, IProject project) internal returns (bool){
    if(ps.projectMap[project] == 1) {
      return true;
    } else {
      return false;
    }
  }

  function get(ProjectSet storage ps, uint index) internal returns (IProject) {
    if(index >= ps.projects.length) { throw; }
    return ps.projects[index];
  }
}
