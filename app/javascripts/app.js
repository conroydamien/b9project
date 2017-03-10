// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import fundinghub_artifacts from '../../build/contracts/FundingHub.json'

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope) {

// MetaCoin is our usable abstraction, which we'll use through the code below.
var FundingHub = contract(fundinghub_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var _gasPrice;
$scope.projs = [];

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the MetaCoin abstraction for Use.
    FundingHub.setProvider(web3.currentProvider);
    _gasPrice = web3.toWei(5, "Shannon");

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

      accounts = accs;
      account = accounts[0];

      updateProjList();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshBalance: function() {
  },
};

function updateProjList() {

  var instance;
  var projects ;
  var numProjs;

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
  .then(function(_projects){
    projects = _projects;
    console.log(projects);

    return Promise.all(
      projects.map(instance.isActive.call)
    );
  })
  .then(function(r) {
    function filterFunc (index) {
      return r[projects.indexOf(index)];
    }
    $scope.projs = projects.filter(filterFunc);
    return $scope.$apply();
  });
};

$scope.createProject = function() {
  FundingHub.deployed().then(function(instance) {
    console.log("account: " + account);
    var target = 3001; // this must be greater than the sum of the
                       // contributions otherwise it will pay out
    var deadline = 1513115725; // later in 2017

    return instance.createProject(account,target,deadline, {from:account, gas:1000000});
  })
  .then(function(r) {
    updateProjList();
    $scope.$apply();
  });
};

$scope.fundProject = function() {
  var instance;
  console.log($scope.projectToFund);
  FundingHub.deployed()
  .then(function(_instance) {
    instance = _instance;
    return instance.contribute($scope.projectToFund, {from:account, value:$scope.amount, gas:1000000});
  })
  .then(function(r) {
    updateProjList();
    $scope.$apply();
  })
}

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
