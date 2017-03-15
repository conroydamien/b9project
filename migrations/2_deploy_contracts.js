var ProjectSetManager = artifacts.require("./ProjectSetManager.sol");
var FundingHub = artifacts.require("./FundingHub.sol");
var Project = artifacts.require("./Project.sol");
var IProject = artifacts.require("./IProject.sol");

module.exports = function(deployer) {
  deployer.deploy(ProjectSetManager);
  deployer.link(ProjectSetManager, FundingHub);
  deployer.deploy(FundingHub)
  deployer.deploy(IProject);
  deployer.deploy(Project);
  
  deployer.new(FundingHub);

  deployer.then(function(){
    return FundingHub.deployed()
    .then(function(_fundingHub) {
      var target = 31644710;
      var deadline = 1513115725; // later in 2017
      return _fundingHub.createProject(target, deadline);
    });
  });
};
