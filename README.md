# Damien Conroy - final project 

## Getting started
This is a project created with Truffle v3.1.2 and Webpack using AngularJS with TestRPC as the target client.
Please see [the Truffle 3 guide](http://truffleframework.com/tutorials/building-testing-frontend-app-truffle-3) for more detail.

From the project directory run `truffle compile` followed by `truffle migrate` (ensure that there is a running instance of TestRPC on port 8545 available) to build and deploy the project, then run 
`npm run build` (refer to [the Truffle 3 guide](http://truffleframework.com/tutorials/building-testing-frontend-app-truffle-3)).

Please ensure that other applications that may provide web3 to the browser (such as MetaMask) are disabled so that the TestRPC accounts may be used. Adaptations may be made to use other wallets later. 

## Using the application
Visit `localhost:8080`. The screen should look similar to the following:
![screenshot](docs/screenshot.png)

### Accounts
The application uses the accounts provided by TestRPC. When the application starts, the first account in the list will have paid to have the application set up and its balance will be slightly lower than the others. 

### Projects
When the application starts there is only one project available for funding. It is created by default as part of the Truffle migration task and belongs to the account that funded the migration.

To create new projects the form at the top-right of the screen can be used.

To create a new project:
1. Choose a deadline by which the project must be funded. This is provided as a number of seconds from epoch.
2. Set a target in Wei to be raised by the project.
3. Identify the owner of the project. This account will cover the gas for creating the project and will receive the project's funds if the project is fully funded before the deadline.
4. Click on the 'Create a Project' button and the project will appear in the list of projects available for funding.

### Funding
To fund a project:
1. In the form at the bottom of the screen choose an account to fund from and an amount to fund.
2. In the list of projects to fund find the project that you wish to fund.
3. Beside the project's id is a button labelled 'Fund', press the button to fund the project.

The interface will update to reflect changes to accounts and projects after project creation or funding.

## Contracts, Events, Views and Controllers
The project consists of the following entities:

* Contracts
..* FundingHub
* Events
* Views
* Controllers

![](docs/class.png)
