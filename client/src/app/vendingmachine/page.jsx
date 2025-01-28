"use client";

import {useState,useEffect} from 'react';
import Web3 from "web3";
import vmContract from '../../../blockchain/firstcontract';

export default function VendingMachine() {
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState('');
  
  useEffect(()=>{
    getInventoryHandler();
  },[]);

  const getInventoryHandler=()=>{
    try{
    const inventory = vmContract.methods.message().call();
    setInventory(inventory);
    console.log(inventory);
    }catch(err){
      console.err(err.message);
      setError(err.message);
    }
  };

    const connectWalletHandler = async ()=>{
        if(typeof window !== "undefined" && typeof window.ethereum !== "undefined"){
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                web3 = new Web3(window.ethereum);
                const account = accounts[0];
                console.log(account);
            } catch (err) {
                setError(err.message);
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
        <div className="container">
          <h2> Vending Machine inventory: {inventory} </h2>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </section>
    </div>
  );
}


