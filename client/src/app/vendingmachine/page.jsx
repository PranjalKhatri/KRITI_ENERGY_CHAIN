"use client";
import Web3 from "web3";

export default function VendingMachine() {
    let web3;
    const connectWalletHandler = async ()=>{
        if(typeof window !== "undefined" && typeof window.ethereum !== "undefined"){
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                web3 = new Web3(window.ethereum);
                const account = accounts[0];
                console.log(account);
            } catch (err) {
                console.log(err);
            }
        }else{
            console.log("Please install metamask");
        }
    };

  return (
    <div>
      <nav className="navbar flex justify-between p-4 bg-gray-800">
        <div>
          <h2 className="text-3xl text-seagreen font-bold">Vending machine</h2>
        </div>
        <button onClick={connectWalletHandler} className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-700 transition duration-300">
          Connect to Wallet
        </button>
      </nav>
      <section>
        
      </section>
    </div>
  );
}


