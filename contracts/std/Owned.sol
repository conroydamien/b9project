pragma solidity ^0.4.2;

/**
 * https://github.com/ethereum/solidity/blob/develop/std/owned.sol
 */

contract Owned {
    address public owner;

    modifier onlyowner() {
        if (msg.sender == owner) {
            _;
        }
    }

    function Owned() {
        owner = msg.sender;
    }
}
