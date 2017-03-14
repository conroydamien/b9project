// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import fundinghub_artifacts from '../../build/contracts/FundingHub.json'
import iproject_artifacts from '../../build/contracts/IProject.json'

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope) {

var FundingHub = contract(fundinghub_artifacts);
var IProject = contract(iproject_artifacts);

var gasRequiredByTestRPC = 1000000;
var defaultDeadline = 1513115725; //Tue, 12 Dec 2017 21:55:25 GMT
$scope.projHash = {}; // model of a project to be used by UI

window.App = {
  start: function() {
    var self = this;

    FundingHub.setProvider(web3.currentProvider);
    IProject.setProvider(web3.currentProvider);
    $scope.deadline = defaultDeadline;
    $scope.accounts = [];

    FundingHub.deployed().then(function(_fundingHub) {
      updateProjList();
      _fundingHub.NewProjectEvent().watch(newProject);
    });

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accs.map(x => $scope.accounts.push({number:x}));
      updateAccounts();
    });
  }
};

/********************************************
 * functions to be called upon receiving events
 */

// called after a NewProjectEvent is received
// from the funding hub
function newProject(e,r) {
    IProject.at(r.args.newProject)
    .then(function(_prj){
      subscribeAndGetData(_prj);
      updateAccounts();
      $scope.$apply(); // update the UI
      return;
    });
}

// called after a ContribEvent is received
// from a project
function updateAfterContribEvent(e,r) {
  var address = r.address;
  updateAccounts();

  return web3.eth.getBalance(address, function(e,r){
    try {
      $scope.projHash[address].balance = r.toString();
    }
    catch (e) {
      console.log(e); // this may fail if the project no longer exists
                      // if so it is safe to ignore it
    }
    $scope.$apply(); // update the UI
  });
};

// called after a DeactivateEvent is received
// from a project
function deleteProjectFromList(e,r) {
  alert("Project " + r.address +
        "\nhas been deactivated. \n\nIt will now be deleted from the list of projects");
  delete $scope.projHash[r.address];
  $scope.$apply();
};

/************************************************
 * Some housekeeping functions to update the model
 * behind the UI when things change
 */
function updateAccounts() {
  function updateBalance(_account) {
    _account.balance = web3.eth.getBalance(_account.number).toString(10);
    return _account;
  }
  Promise.all(
    $scope.accounts.map(updateBalance)
  )
  $scope.$apply(); // update the UI
}

function updateProjList() {
  var fundingHub;
  var allProjects;

  return FundingHub.deployed().then(function(_fundingHub) {
    fundingHub = _fundingHub;
    return fundingHub.allProjects.call();
  })
  .then(function(_projects) { // all projects, active and inactive
    allProjects = _projects;
    return Promise.all(
      _projects.map(fundingHub.isActive.call)
    );
  })
  .then(function(active) { // 'active' is an array of true/false values
    function filterFunc (address) {
      return active[allProjects.indexOf(address)];
    }
    return allProjects.filter(filterFunc);
  })  // the filter returns an array of active projects
  .then(function(_liveProjects) {
    return Promise.all(
      _liveProjects.map(IProject.at)
    )
  })
  .then(function(_liveProjectContractList) {
    return Promise.all(
      _liveProjectContractList.map(subscribeAndGetData)
    )
  })
  .then(function(r) {
    return $scope.$apply();
  });
};

/******
 * This function subscribes to events
 * produced by the project and puts
 * its data into a hash for the UI model
 */
function subscribeAndGetData(_prj) {
  var prj = _prj;
  var data;
  var projDataHash = {};

  return prj.projectData.call()
  .then(function(_data){
    data = _data
    return prj.DeactivateEvent().watch(deleteProjectFromList);
  })
  .then(function(r){
    return prj.ContribEvent().watch(updateAfterContribEvent);
  })
  .then(function (r) {
    return web3.eth.getBalance(prj.address).toString(10);
  })
  .then(function (balance) {
    $scope.projHash[prj.address] = {address: prj.address,
    owner: data[0],
    target: data[1].toString(10),
    deadline: data[2].toString(10),
    balance: balance}
    $scope.$apply();
    return;
  });
}

/********************************
 * Angular controller functions
 */

$scope.createProject = function() {
  FundingHub.deployed().then(function(instance) {
    return instance.createProject($scope.newProjectOwner.number,
                                  $scope.target,
                                  $scope.deadline,
                                  {from:$scope.newProjectOwner.number, gas:gasRequiredByTestRPC});
  })
  .catch(function(error) {
    alert("Error creating project.");
  })
  .then(function(r) {
    updateAccounts();
    $scope.$apply();
  });
};

$scope.fundProject = function(proj) {
  $scope.projs
  var instance;
  FundingHub.deployed()
  .then(function(_instance) {
    instance = _instance;
    return instance.contribute(proj, {from:$scope.account.number,
                                      value:$scope.amount,
                                      gas:gasRequiredByTestRPC});
  })
  .catch(function(error) {
    alert("There has been an error making the contribution.");
  })
  .then(function(r) {
    updateAccounts();
    $scope.$apply();
  })
}

/* end of controller functions
/*******************************/


/********
 * Remainder of boilerplate code from sample Truffle appear
 */

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
});
