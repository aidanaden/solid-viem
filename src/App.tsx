import { Show, createEffect, createSignal } from "solid-js";
import solidLogo from "./assets/solid.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import { EthereumProvider } from "@walletconnect/ethereum-provider";
import {
  http,
  Address,
  Hash,
  TransactionReceipt,
  createPublicClient,
  createWalletClient,
  custom,
  parseEther,
  stringify,
} from "viem";
import { mainnet } from "viem/chains";
import "viem/window";

const projectId = "fdb8164b4aa07b46f14e131f5c7c5903";

const provider = await EthereumProvider.init({
  chains: [1],
  projectId,
  showQrModal: false,
});

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum!),
});

function App() {
  const [account, setAccount] = createSignal<Address>();
  const [hash, setHash] = createSignal<Hash>();
  const [receipt, setReceipt] = createSignal<TransactionReceipt>();
  const [msg, setMsg] = createSignal<string>("");
  const [sig, setSig] = createSignal<string>("");

  let addressInput: HTMLInputElement;
  let valueInput: HTMLInputElement;

  const connectMobile = async () => {
    await provider.connect();
    const [address] = await walletClient.getAddresses();
    setAccount(address);
  };

  const connect = async () => {
    // await provider.connect();
    const [address] = await walletClient.requestAddresses();
    setAccount(address);
  };

  const sendTransaction = async () => {
    const acc = account();
    if (!acc) {
      return;
    }
    const hash = await walletClient.sendTransaction({
      account: acc,
      to: addressInput.value as Address,
      value: parseEther(valueInput.value as `${number}`),
    });
    console.log("test", hash);
    setHash(hash);
  };

  const signMessage = async () => {
    const acc = account();
    const _msg = msg();
    if (!acc || !_msg) {
      return;
    }
    const sign = await walletClient.signMessage({
      account: acc,
      message: _msg,
    });
    alert(`signature of signed message: ${sign.toString()}`);
    setSig(sign);
  };

  const verifySignature = async () => {
    const acc = account();
    const _sig = sig();
    const _msg = msg();
    if (!acc || !_sig || !_msg) {
      return;
    }
    let cleanedSig = _sig.replace(" ", "");
    cleanedSig = _sig.replace("\n", "");
    const valid = await publicClient.verifyMessage({
      address: acc,
      message: _msg,
      signature: cleanedSig as Address,
    });
    if (valid === true) {
      alert("valid message and signature!");
    } else {
      alert("invalid message/signature!");
    }
  };

  createEffect(async () => {
    const h = hash();
    if (!h) {
      return;
    }
    const receipt = await publicClient.waitForTransactionReceipt({ hash: h });
    setReceipt(receipt);
  });

  return (
    <>
      <div class="flex items-center justify-center">
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} class="logo" alt="Vite logo" />
        </a>
        <a href="https://solidjs.com" target="_blank">
          <img src={solidLogo} class="logo solid" alt="Solid logo" />
        </a>
      </div>
      <h1>Vite + Solid</h1>
      <Show
        when={account()}
        fallback={
          <div>
            <button onClick={connect}>Connect Wallet</button>
            <button onClick={connectMobile}>Connect WalletConnect</button>
          </div>
        }
      >
        {(acc) => (
          <>
            <div>Connected: {acc()}</div>
            <div class="flex gap-3">
              <input ref={addressInput} placeholder="address" />
              <input ref={valueInput} placeholder="value (ether)" />
              <button onClick={sendTransaction}>Send Tx</button>
            </div>
            <div class="flex gap-3">
              <input
                value={msg()}
                onInput={(e) => setMsg(e.target.value)}
                placeholder="message"
              />
              <button onClick={signMessage}>Sign Message</button>
            </div>
            <div class="flex gap-3">
              <input
                value={sig()}
                onInput={(e) => setSig(e.target.value)}
                placeholder="signature"
              />
              <button onClick={verifySignature}>Verify Signature</button>
            </div>
            <Show when={receipt()}>
              {(rec) => (
                <div>
                  Receipt:{" "}
                  <pre>
                    <code>{stringify(rec(), null, 2)}</code>
                  </pre>
                </div>
              )}
            </Show>
          </>
        )}
      </Show>
    </>
  );
}

export default App;
