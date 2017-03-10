var ProjectSetManager = artifacts.require("./ProjectSetManager.sol");
var FundingHub = artifacts.require("./FundingHub.sol");
var Project = artifacts.require("./Project.sol");
var IProject = artifacts.require("./IProject.sol");

module.exports = function(deployer) {
  deployer.deploy(ProjectSetManager);
  deployer.link(ProjectSetManager, FundingHub);
  deployer.deploy(FundingHub);
  deployer.deploy(IProject);
  deployer.deploy(Project);
  //TODO: add call to createProject
};
