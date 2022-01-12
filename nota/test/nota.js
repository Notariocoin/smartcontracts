const erc20contract = artifacts.require("NOTAt");
const math  = require("math");
const truffleAssert = require('truffle-assertions');

contract("erc20contract", (accounts) => {
  let ERC20Instance = null;
  var owner = accounts[0];
  var second = accounts[2];
  var donor = accounts[3];
  var MAXSUPPLY = 1000000000;
  var DECIMALS = 18;
  var SYMBOL = "NOTA";

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  it("1.- Should deploy the ERC20 Token", async () => {
    ERC20Instance = await erc20contract.new();
  });


  it('2.- The issuer has the Admin role', async () => {
    assert.equal(await ERC20Instance.hasRole.call(await ERC20Instance.DEFAULT_ADMIN_ROLE(), owner), true, "Nobody has the admin role!");
  });


  it("3.- Check al balance de TOKENS y el Supply", async function() {    
    await accounts.forEach(async function(id) {        
      ERC20Instance.balanceOf.call(id).then(function(balance) {
    		web3.eth.getBalance(id, function(err, balanceE) {
     			console.log("" + id + ":\tbalance: " + web3.utils.fromWei(balanceE, "ether") + " ether, " + web3.utils.fromWei(balance.valueOf(), "ether") + " NOTA");          
   		  });
      });   
      await timeout(1000);   
    }); 

    await ERC20Instance.totalSupply().then(function(balance) {    		
      let supply = web3.utils.fromWei(balance, "ether");
      console.log("Total Supply " + supply + " " + SYMBOL);      
      assert.equal(supply, MAXSUPPLY, "Minado no coincide con supply esperado");
    }); 
  });


  it("4.- Symbol test", async () => {    
    assert.equal(await ERC20Instance.symbol(), SYMBOL, "Invalid ERC20 Symbol");
  });


  it("5.- Check MAXSUPPLY", async () => {    
    assert.equal(web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether"), MAXSUPPLY, "Invalid SUPPLY");
  });


  it("6.- Decimals test", async () => {    
    await assert.equal(await ERC20Instance.decimals(), DECIMALS, "Decimals mismatch");
  });


  it("7.- Paused test", async () => {    
    assert.equal(await ERC20Instance.paused(), true, "Paused state mismatch");
  });


  it('8.- Owner is ADMIN', async function () {
    assert.equal(await ERC20Instance.hasRole(await ERC20Instance.DEFAULT_ADMIN_ROLE(), owner), true, "Owner does not have DEFAULT_ADMIN_ROLE!");
  });


  it('9.- Owner is the only ADMIN', async function () {
    assert.equal(await ERC20Instance.getRoleMemberCount(await ERC20Instance.DEFAULT_ADMIN_ROLE()), 1, "More than 1 admin!");
  });


  it('10.- It is possible create a new admin', async function () {
    try{
      await ERC20Instance.grantRole.sendTransaction(await ERC20Instance.DEFAULT_ADMIN_ROLE(), donor);
      assert.equal(await ERC20Instance.hasRole(await ERC20Instance.DEFAULT_ADMIN_ROLE(), donor), true, "Account hasnt  DEFAULT_ADMIN_ROLE!");                
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error:  Becoming an account into Admin');      
    }
  });


  it('11.- A new admin can NOT pause the token without PAUSER_ROLE', async function () {
    try{
      await ERC20Instance.pause.sendTransaction({from: donor});
      assert.equal(true, false, 'The new admin cannot pause');      
    }
    catch(e){
      return true;
    }
  });


  it('12.- A new admin can grantRole to other accounts', async function () {
    try{
      await ERC20Instance.grantRole.sendTransaction(await ERC20Instance.TRANSFER_ROLE(), second);
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error:  The new admin cannot grant roles');      
    }
  });


  it('13.- Reverting the creation of a new admin', async function () {
    try{
      await ERC20Instance.revokeRole.sendTransaction(await ERC20Instance.DEFAULT_ADMIN_ROLE(), donor);
      assert.equal(await ERC20Instance.hasRole(await ERC20Instance.DEFAULT_ADMIN_ROLE(), donor), false, "Account has already DEFAULT_ADMIN_ROLE!");                
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error: Reverting an account from Admin');      
    }
  });


  it('14.- Regular accounts hasnt the TRANSFER_ROLE', async function () {
    assert.equal(await ERC20Instance.hasRole(await ERC20Instance.TRANSFER_ROLE(), donor), false, "Account has already TRANSFER_ROLE!");
  });


  var tokens = 5000;
  it('15.- Without TRANSFER_ROLE nobody can transfer even when the token is PAUSED', async function () {
    try{
      await ERC20Instance.transfer.sendTransaction(owner, web3.utils.toWei(""+tokens, "ether"), { from: donor});
      assert.equal(true, false, 'Error:  it returns true!');
    }
    catch(e){
      return true;
    }
  });

  it('16.- Granting TRANSFER_ROLE, an account can transfer even when the token is PAUSED.', async function () {
    try {
      await ERC20Instance.grantRole.sendTransaction(await ERC20Instance.TRANSFER_ROLE(), donor);
      await ERC20Instance.transfer.sendTransaction(owner, web3.utils.toWei(""+tokens, "ether"), { from: donor});
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error: Transfer didnt occur  from ' +  donor);
    }
  });

  it('17.- Grant TRANSFER_ROLE to an account', async function () {
    let role = await ERC20Instance.TRANSFER_ROLE();
    try{
      await ERC20Instance.grantRole.sendTransaction(role, donor);
      assert.equal(await ERC20Instance.hasRole(role, donor), true, "Error assigning TRANSFER_ROLE!");
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error: Problem granting TRANSFER_ROLE!');
    }
  });


  it('18.- Nobody can burn when paused', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), true, "Paused state mismatch");
      await ERC20Instance.burn.sendTransaction(web3.utils.toWei(""+tokens, "ether"), { from: donor});
      assert.equal(true, false, 'The burn should not be done');
    }
    catch(e){
      return true;
    }
  });


  it('19.- MINTER_ROLE can burnFrom when paused', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), true, "Paused state mismatch");
      await ERC20Instance.burnFrom.sendTransaction(donor, web3.utils.toWei(""+tokens, "ether"));      
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error:The burnFrom should be done');
    }
  });

  
  it('20.- Without MINTER_ROLE cannot burnFrom when paused', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), true, "Paused state mismatch");
      await ERC20Instance.burnFrom.sendTransaction(owner, web3.utils.toWei(""+tokens, "ether"), { from: donor});      
      assert.equal(true, false, 'The burnFrom shouldnt be done');
    }
    catch(e){
      return true;
    }
  });


  it('21.- MINTER_ROLE can mint tokens when paused or not', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), true, "Paused state mismatch");
      await ERC20Instance.mint.sendTransaction(owner, web3.utils.toWei("" + (tokens/2), "ether"));
      console.log("totalSupply until now " + (await web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether")) + " " + SYMBOL );          
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error:Problems minting tokens');      
    }
  });


  it('22.- Token can be Unpaused', async function () {
    try{
      await ERC20Instance.unpause.sendTransaction();
      assert.equal(await ERC20Instance.paused(), false, "Unpaused failed !");      
    }
    catch(e){
      assert.equal(await ERC20Instance.paused(), false, e + ' ; Something went wrong Unpausing the token!');
    }
  });



  it('23.- Nobody can pause a contract again', async function () {
    try {
        // TOKEN UNPAUSED TESTS 
      console.log("\n\nTOKEN UNPAUSED --------------\n\n\n");
      await timeout(500);
      await ERC20Instance.pause.sendTransaction();
      assert.equal(await ERC20Instance.paused(), false, "Once paused, it can't be reverted!");

    } catch (e) {
      return true;
    }        
  });


  it('24.- Removing TRANSFER_ROLE, the account can still transfer', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), false, "Paused state mismatch");
      await ERC20Instance.revokeRole.sendTransaction(await ERC20Instance.TRANSFER_ROLE(), donor);
      await ERC20Instance.transfer.sendTransaction(owner, web3.utils.toWei(""+tokens, "ether"), { from: donor});
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error: Problem transfering 1');
    }
  });


  it('25.- MINTER_ROLE cannot burnFrom when NOT paused', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), false, "Paused state mismatch");
      await ERC20Instance.burnFrom.sendTransaction(donor, web3.utils.toWei(""+tokens, "ether"));      
      assert.equal(true, false, 'Error: The burnFrom shouldnt be done');
    }
    catch(e){
      return true;
    }
  });


  it('26.- MINTER_ROLE can mint tokens when paused or not', async function () {
    try{
      assert.equal(await ERC20Instance.paused(), false, "Paused state mismatch");
      await ERC20Instance.mint.sendTransaction(owner, web3.utils.toWei("" + (tokens/2), "ether"));
      console.log("totalSupply until now " + (await web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether")) + " " + SYMBOL );          
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error:Problems minting tokens');      
    }
  });


  it('27.- New tokens can be minted up to MAXSUPPLY', async function () {
    try{      
      let ts = await web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether");
      await ERC20Instance.mint.sendTransaction(owner, web3.utils.toWei("" + (MAXSUPPLY - ts), "ether"));          
      assert(await web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether"),MAXSUPPLY, "Problems minting up to MAXSUPPLY");
    }
    catch(e){
      assert.equal(true, false, e + ' ; Error: Problems minting tokens');      
    }
  });


  it('28.- Cannot be minted beyond MAXSUPPLY', async function () {
    try{            
      await ERC20Instance.mint.sendTransaction(owner, web3.utils.toWei("100" , "ether"));          
      assert.equal(true, false, 'Error! It is possible to mint tokens beyond MAXSUPPLY');      
    }
    catch(e){
      return true;      
    }
  });
  

  it("99.- Check al balance de TOKENS y el Supply. FINAL", async function() {
    await accounts.forEach(async function(id) {
      await ERC20Instance.balanceOf.call(id).then(async function(balance) {
        await web3.eth.getBalance(id, function(err, balanceE) {
          console.log("" + id + ":\tbalance: " + web3.utils.fromWei(balanceE, "ether") + " ether, " + web3.utils.fromWei(balance.valueOf(), "ether") + " NOTA");
        });
      });
    });
    await timeout(1000); 
    console.log(await web3.utils.fromWei("" + (await ERC20Instance.totalSupply()), "ether") + " " + SYMBOL );
    await timeout(1000);   
  });

});
