pragma solidity ^0.4.8;

/**
 * https://github.com/ethereum/solidity/blob/develop/std/mortal.sol
 */

import "./Owned.sol";

contract Mortal is Owned {


  event MortalEvent(
     string message,
     address mortal
  );


    function kill() onlyowner public {
        if (msg.sender == owner) {

            MortalEvent("about to kill", this);

            selfdestruct(owner);
        }
    }
}
