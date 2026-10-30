import "./style.css";
import { createClient, isSuccessful } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionHashVariant } from "genlayer-js/types";

const RELYNX = "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa";
const GATE = "0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b";
const EXPLORER = "https://explorer-studio.genlayer.com/tx/";
const $ = (id) => document.getElementById(id);
const reader = createClient({chain: studionet});
let wallet = null, account = null, selected = 2;
const finalized = TransactionHashVariant.LATEST_FINAL;
const asObject = (value) => { if (typeof value === "string") return JSON.parse(value); if (value && typeof value === "object") return value; throw new Error("Unexpected contract response"); };
const setStatus = (message, type="") => { const el=$("globalStatus"); el.textContent=message; el.className="alert "+type; };
const short = (text) => text && text.length > 24 ? text.slice(0,12)+"…"+text.slice(-8) : String(text ?? "—");
function node(tag, text, className) { const el=document.createElement(tag); if(text!==undefined)el.textContent=String(text); if(className)el.className=className; return el; }
function pair(parent, label, value) { parent.append(node("dt",label));parent.append(node("dd",value)); }
function transaction(title, detail, hash) {
 $("txPanel").hidden=false; $("txTitle").textContent=title; $("txStatus").textContent=detail;
 $("txLink").hidden=!hash;
 if(hash) $("txLink").href=EXPLORER+hash;
}
function errMessage(error){return error instanceof Error ? error.message : String(error);}
async function read(address,functionName,args=[]) {
 return reader.readContract({address,functionName,args,transactionHashVariant:finalized});
}
async function refresh() {
 setStatus("Reading finalized chain state…");
 try {
  const [count,receiptCount] = await Promise.all([read(RELYNX,"claim_count"),read(GATE,"receipt_count")]);
  const n = Number(count), receipts = Number(receiptCount);
  if(!Number.isFinite(n)||!Number.isFinite(receipts)) throw new Error("Invalid counter response");
  $("claimCount").textContent=String(n); $("receiptCount").textContent=String(receipts);
  const ids=$("claimList");ids.replaceChildren();
  for(let id=Math.min(n,12);id>=Math.max(1,n-7);id--){
   const b=node("button","#"+id,id===selected?"active":"");
   b.type="button";b.onclick=()=>loadClaim(id);ids.append(b);
  }
  if(!n) ids.append(node("span","No claims found."));
  await Promise.all([n?loadClaim(Math.min(selected,n)):Promise.resolve(), receipts?loadReceipt(receipts):Promise.resolve()]);
  if(!receipts)$("receiptDetails").textContent="No receipt has been written to the Consumer Gate.";
  setStatus("Showing finalized Studionet state from deployed contracts.","success");
 } catch (error) {
  setStatus("Live read unavailable: "+errMessage(error),"error");
  $("claimCount").textContent="—";$("receiptCount").textContent="—";
 }
}
async function loadClaim(id) {
 const value=Number(id);
 if(!Number.isInteger(value)||value<1){setStatus("Enter a valid positive claim ID.","error");return;}
 selected=value;$("claimId").value=String(value);
 const wrapper=$("claimDetails");wrapper.textContent="Loading claim #"+value+"…";
 try {
  const [raw,canAct] = await Promise.all([read(RELYNX,"claim_status",[value]),read(GATE,"can_act",[value])]);
  const info=asObject(raw);wrapper.replaceChildren();
  const head=node("div",undefined,"detail-top");
  head.append(node("strong","Claim #"+value));
  const eligible=info.can_rely===true;head.append(node("span",eligible?"Eligible to rely":"Not eligible", "pill "+(eligible?"ok":"block")));
  wrapper.append(head);
  const dl=node("dl",undefined,"meta");
  pair(dl,"State",info.state);pair(dl,"Decision",info.last_decision||"Not reviewed");
  pair(dl,"Can act",canAct===true?"Yes · gate allows":"No · gate blocks");
  pair(dl,"Claim key",info.key);pair(dl,"Issuer",short(info.issuer));
  pair(dl,"Repository",info.repo);pair(dl,"Parent A",info.parent_a||"None");
  pair(dl,"Parent B",info.parent_b||"None");pair(dl,"Statement",info.statement);
  wrapper.append(dl);
  for(const btn of $("claimList").querySelectorAll("button"))btn.classList.toggle("active",btn.textContent==="#"+value);
  $("actionClaim").value=String(value);
 }catch(error){wrapper.textContent="Unable to read claim #"+value+": "+errMessage(error);}
}
async function loadReceipt(id){
 try{
  const raw=await read(GATE,"receipt",[id]);
  const data=asObject(raw),el=$("receiptDetails");el.replaceChildren();
  const dl=node("dl",undefined,"meta");
  pair(dl,"Receipt",data.receipt_id);pair(dl,"Claim",data.claim_id);
  pair(dl,"Action",data.action_key);pair(dl,"Actor",data.actor);
  el.append(dl);
 }catch(error){$("receiptDetails").textContent="Receipt read failed: "+errMessage(error);}
}
async function connectWallet(){
 const provider=window.ethereum;
 if(!provider){setStatus("No EIP-1193 wallet detected. Install a compatible wallet to sign transactions.","error");return;}
 try {
  const [address] = await provider.request({method:"eth_requestAccounts"});
  if(!address)throw new Error("Wallet has no selected address");
  const candidate=createClient({chain:studionet,account:address,provider});
  await candidate.connect("studionet");
  wallet=candidate;account=address;
  $("walletState").textContent=short(address);
  $("connectWallet").textContent="Connected";
  setStatus("Wallet connected to GenLayer Studionet. Signed actions are available.","success");
 }catch(error){wallet=null;account=null;setStatus("Wallet connection failed: "+errMessage(error),"error");}
}
async function write(address,functionName,args){
 if(!wallet||!account) {setStatus("Connect your wallet first.","error");return;}
 const request={address,functionName,args};
 try {
  transaction("Preparing transaction", "Checking execution fees before wallet approval…");
  const estimate=await wallet.estimateTransactionFeesForWrite(request);
  const hash=await wallet.writeContract({...request,fees:{distribution:estimate.distribution,feeValue:estimate.feeValue}});
  transaction("Submitted to GenLayer","Transaction pending finalization. Do not assume success before execution result is available.",hash);
  const receipt=await reader.waitForFinalization({hash});
  if(!isSuccessful(receipt)){
   transaction("Execution not successful","Finalized, but GenVM did not report success. Inspect rollback or status in Explorer.",hash);
   setStatus("Transaction did not execute successfully. See Explorer for details.","error");
   return;
  }
  transaction("Transaction finalized","GenVM execution succeeded. Refreshing the contract state.",hash);
  await refresh();
 }catch(error){transaction("Transaction not completed",errMessage(error));setStatus("Transaction error: "+errMessage(error),"error");}
}
$("refresh").onclick=refresh;
$("loadClaim").onclick=()=>loadClaim($("claimId").value);
$("claimId").onkeydown=(e)=>{if(e.key==="Enter")loadClaim($("claimId").value);};
$("connectWallet").onclick=connectWallet;
$("dismissTx").onclick=()=>{$("txPanel").hidden=true;};
$("checkAction").onclick=async()=>{
 const id=Number($("actionClaim").value);if(!Number.isInteger(id)||id<1)return;
 $("eligibility").textContent="Checking live eligibility…";
 try{
  const res=await read(GATE,"can_act",[id]);
  $("eligibility").textContent=res===true?"Consumer Gate: ALLOWED. Wallet signature still required to record a receipt.":"Consumer Gate: BLOCKED. A signed action should not succeed for this claim.";
 }catch(e){$("eligibility").textContent="Eligibility unavailable: "+errMessage(e);}
};
$("actionForm").onsubmit=(e)=>{e.preventDefault();const id=Number($("actionClaim").value);if(!Number.isInteger(id)||id<1)return;write(GATE,"perform_action",[id,$("actionKey").value]);};
$("registerForm").onsubmit=(e)=>{e.preventDefault();
 const args=[$("repoOwner").value.trim(),$("repoName").value.trim(),$("claimKey").value.trim(),$("claimStatement").value.trim(),Number($("parentA").value),Number($("parentB").value)];
 if(args[3].length<32){setStatus("Claim statement must be at least 32 characters.","error");return;}
 write(RELYNX,"register_claim",args);
};
$("noticeForm").onsubmit=(e)=>{e.preventDefault();
 const commit=$("noticeCommit").value.trim(),sha=$("noticeDigest").value.trim();
 if(!/^[0-9a-f]{40}$/.test(commit)||!/^[0-9a-f]{64}$/.test(sha)){setStatus("Commit and notice digest must be full lowercase hexadecimal strings.","error");return;}
 if(!confirm("This review can permanently revoke a claim if the notice is accepted. Continue?"))return;
 write(RELYNX,"review_notice",[Number($("noticeClaim").value),commit,sha]);
};
window.ethereum?.on?.("accountsChanged",()=>{wallet=null;account=null;$("walletState").textContent="Wallet changed · Reconnect";$("connectWallet").textContent="Connect wallet";});
refresh();
