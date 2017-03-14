var FundingHub = artifacts.require("./FundingHub.sol");
var Project = artifacts.require("./Project.sol");

contract('FundingHub', function(accounts) {

  const PromisifyWeb3 = require("./promisifyWeb3.js");
  PromisifyWeb3.promisify(web3);

  var fundingHub;
  var projectOwnerAccount = accounts[5];
  var payingAccount = accounts[3];
  var funderAccounts = [accounts[7],
                        accounts[8],
                        accounts[9],
                        accounts[4],
                        accounts[6]];

  var contrib = {};
    contrib[funderAccounts[0]] = 200;
    contrib[funderAccounts[1]] = 400;
    contrib[funderAccounts[2]] = 800;
    contrib[funderAccounts[3]] = 1600;
    contrib[funderAccounts[4]] = 0;

  var funderBalanceBeforeContribution = [];
  var gasCostForFunder = [];
  var totalContribution = 0;

  var target = 3001; // this must be greater than the sum of the
                     // contributions otherwise it will pay out
  var deadline = 1513115725; // later in 2017
  var projectToFund;

 // contribute to a project from four accounts
 // and check that the refunds are correct
 it("test refunds", function() {
     return FundingHub.new()
     .then(function(_fundingHub) {
       fundingHub = _fundingHub;
       return fundingHub.createProject(projectOwnerAccount, target, deadline, {from: payingAccount});
     })
     .catch(function(error) {
       console.log(error);
     })
     .then(function(tx_id){
       return fundingHub.allProjects.call();;
     })
     .catch(function(error) {
       console.log(error);
     })
     .then(function(_projects) {
         projectToFund = _projects[0];

         var recordBalance = function(funder) {
           web3.eth.getBalancePromise(funder)
           .then(function(funderOpeningBalance) {
             funderBalanceBeforeContribution[funder] = funderOpeningBalance;
           });
         }

         // record the balance for each funding account before
         // funding the project
         return Promise.all(
           funderAccounts.map(recordBalance)
         )
     })
     .then(function(r){
         var fundTheProject = function(funder) {
           totalContribution += contrib[funder];
           return fundingHub.contribute(projectToFund, {from: funder, value:contrib[funder]});
         }

         // contribute from each funding account
         // to the project
         return Promise.all(
           funderAccounts.map(fundTheProject)
         );
     })
     .catch(function(error) {
        console.log("contribution failed: " + error);
     })
     .then(function (tx) {
        var recordGasCosts = function(tx) {
           web3.eth.getTransactionPromise(tx.tx).then(function (txn) {
             var cost = tx.receipt.gasUsed * txn.gasPrice;
             gasCostForFunder[txn.from] = cost;
           });
        }

         // record the gas cost incurred by each funder
        return tx.map(recordGasCosts);
     })
     .then(function(r) {
        return web3.eth.getBalancePromise(projectToFund);
     })
     .catch(function(error) {
        console.log(error);
     })
     .then(function(projectBalance) {

        // ensure that the project balance is equal to the
        // total of all contributions
        return assert.equal(projectBalance
                            .minus(totalContribution).toString(10),
                            0, "Project balance before refund equals the total of all contributions.");
     })
     .catch(function(error) {
         console.log(error);
     })
     .then(function(r) {
       var checkBalanceAfterContribution = function(funder) {
         return web3.eth.getBalancePromise(funder)
         .then(function(balanceAfterContribution) {
           return assert.equal(balanceAfterContribution
                               .plus(contrib[funder])
                               .plus(gasCostForFunder[funder])
                               .minus(funderBalanceBeforeContribution[funder]).toString(10),
                               0, "Funder balance after contribution takes gas cost into account.");
         });
       };

       // ensure that after the contributions each funder's balance
       // reflects their contribution and gas cost
       return Promise.all(
         funderAccounts.map(checkBalanceAfterContribution)
       );
     }).catch(function(error) {
       console.log(error);
     })
     .then(function(r) {

       // refund!

       return Project.at(projectToFund).refund();
     })
     .then(function(r) {
       return web3.eth.getBalancePromise(projectToFund);
     }).catch(function(error) {
       console.log(error);
     })
     .then(function(projectBalance) {
       return assert.equal(projectBalance.toString(10), 0,
                           "Project has a balance of zero after refund.");
     })
     .then(function(r) {

       var checkBalanceAfterContribution = function(funder) {
         return web3.eth.getBalancePromise(funder)
         .then(function(balanceAfterRefund) {
           return assert.equal(balanceAfterRefund
                               .plus(gasCostForFunder[funder])
                               .minus(funderBalanceBeforeContribution[funder]).toString(10)
                               , 0, "After refund the funder has only incurred the gas cost.");
         });
       };

       // ensure that after the refunds each funder
       // has incurred only the gas cost
       return Promise.all(
         funderAccounts.map(checkBalanceAfterContribution)
       );
     })
     .catch(function(error) {
       console.log(error);
     });
   });
 });
