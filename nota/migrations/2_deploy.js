const Token = artifacts.require('@openzeppelin/contracts/nota');

module.exports = function(deployer) {
  deployer.deploy(Token, 'NOTARIOCOIN', 'NOTA');
};

