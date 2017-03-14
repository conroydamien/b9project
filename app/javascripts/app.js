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

var accounts = [];
var account;
var _gasPrice;
$scope.projHash = {};


function updateAfterContribEvent(e,r) {
  console.log("r: " + r.address);
  var address = r.address;
  var balance;

  updateAccounts();

  return web3.eth.getBalance(r.address, function(e,r){
    balance = r.toString();
    try {
      $scope.projHash[address].balance = balance;
    }
    catch (e) {
      console.log(e);
    }
    $scope.$apply();
    console.log("balance: " + balance);
  });
};

function deleteProjectFromList(e,r) {
  delete $scope.projHash[r.address];
  $scope.$apply();
};

window.App = {
  start: function() {
    var self = this;

    FundingHub.setProvider(web3.currentProvider);
    IProject.setProvider(web3.currentProvider);
    _gasPrice = web3.toWei(5, "Shannon");
    $scope.deadline = 1513115725;

    FundingHub.deployed().then(function(_instance) {

    updateProjList();

      var prj;
      var data;

      _instance.NewProjectEvent().watch(function(e,r) {

          updateAccounts();

          IProject.at(r.args.newProject)
          .then(function(r){
            prj = r;
            return r.projectData.call()
          })
          .then(function (_data) {
            data = _data;
            console.log("created " + prj.address);
            return data.push(prj.address);
          })
          .then(function(r){
            return prj.ContribEvent().watch(updateAfterContribEvent);
          })
          .then(function(r){
            return prj.DeactivateEvent().watch(deleteProjectFromList);
          })
          .then(function (r) {
            return web3.eth.getBalance(prj.address).toString(10);
          })
          .then(function (balance) {
            data.push(balance);
            $scope.projHash[prj.address] = {address: prj.address, owner: data[0], deadline: data[2], target: data[1], balance: balance};
            console.log($scope.projHash);
            $scope.projsToFundLabel = 'Projects to fund';
            $scope.$apply();
            return;
          })
      });
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

      accs.map(x => accounts.push({number:x}));
      account = accounts[0];

      updateAccounts();
    });
  }
};

function updateAccounts() {

  function addBalance(account) {
    account.balance = web3.eth.getBalance(account.number).toString(10);
    return account;
  }

  Promise.all(
    accounts.map(addBalance)
  )

  $scope.accounts=accounts;
  $scope.$apply();
}

function updateProjList() {

  var instance;
  var projects;
  var liveProjs;
  var numProjs;
  var projHash = {};

  return FundingHub.deployed().then(function(_instance) {
    instance = _instance;
    console.log(instance);
    return instance.numberOfProjects.call();
  })
  .then(function(_numProjs) {
    numProjs = _numProjs;
    console.log("num projs:" + numProjs);
    return Promise.all(
      Array(numProjs.toNumber()).fill().map(instance.getProjectListElement.call)
    );
  })
  .then(function(_projects) {
    projects = _projects;
    return Promise.all(
      projects.map(instance.isActive.call)
    );
  })
  .then(function(active) {
    console.log("about to filter");

    function filterFunc (address) {
      return active[projects.indexOf(address)];
    }

    return projects.filter(filterFunc);
  })
  .then(function(projects) {
    console.log("filtered");
    liveProjs = projects;

    return Promise.all(
      projects.map(IProject.at)
    )
  })
   .then(function(projectList) {
    console.log(projectList);

    function append(_prj) {
      var prj = _prj;
      var data;

      return prj.projectData.call()
      .then(function(_data){
        data = _data
        return prj.FundedEvent().watch(updateAfterFundedEvent);
      })
      .then(function(r){
        return prj.ContribEvent().watch(updateAfterContribEvent);
      })
      .then(function (r) {
        projHash[prj.address] = {address: prj.address,
        owner: data[0],
        target: data[1].toString(10),
        deadline: data[2].toString(10)}
        data.push(prj.address);
        return data;
      })
    }

    return Promise.all(
      projectList.map(append)
    )
  })
  .then(function(projData) {

    function addBalance(projData) {
       projData.push(web3.eth.getBalance(projData[3]).toString(10));
       projHash[projData[3]].balance = projData[4];
       return projData;
    }

    return Promise.all(
      projData.map(addBalance)
    )
  })
  .then(function(projData) {
    console.log(projData);
    $scope.projHash = projHash;
    return $scope.$apply();
  });
};

////////////////////////////////////////////////
// controller functions

$scope.createProject = function() {
  FundingHub.deployed().then(function(instance) {
    console.log("account: " + account);
    return instance.createProject($scope.newProjectOwner.number,$scope.target,$scope.deadline, {from:$scope.newProjectOwner.number, gas:1000000});
  }) // what if there's an error
  .then(function(r) {
    updateAccounts();
    $scope.$apply();
  });
};

$scope.fundProject = function(proj) {
  $scope.projs
  console.log("proj to fund: " + proj);
  var instance;
  FundingHub.deployed()
  .then(function(_instance) {
    instance = _instance;
    return instance.contribute(proj, {from:$scope.account.number, value:$scope.amount, gas:1000000});
  })
  .then(function(r) {
    updateAccounts();
    $scope.$apply();
  })
}

// end of controller functions
//////////////////////////////////////////////////////////

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
