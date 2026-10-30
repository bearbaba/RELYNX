import "./style.css";
import { createClient, isSuccessful } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const RELYNX = "0x69c3468823F60Fc6a37b3c141EEc1Bd2fD8176Fa";
const GATE = "0xe3421601C4F2Fc5cb5b7922cbA98fA0A6B701B0b";
const EXPLORER = "https://explorer-studio.genlayer.com/tx/";
const reader = createClient({chain:studionet});
const $ = id => document.getElementById(id);
let wallet = null, account = null, selected = 2, gateClaim = 3, gateAllowed = false;
let locked = false, latestHash = null, refreshToken = 0;
const toObject = v => typeof v === "string" ? JSON.parse(v) : v;
const short = v => typeof v === "string" && v.length > 24 ? v.slice(0,8)+"…"+v.slice(-6) : String(v ?? "—");
const errText = e => e instanceof Error ? e.message : String(e);
function element(tag,text,cls){ const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;}
function pair(container,label,value){container.append(element("dt",label),element("dd",value===undefined||value===null?"—":value));}
function setRead(text,kind=""){ $("readStatus").textContent=text;$("readNotice").className="notice "+kind; }
function tx(title,description,hash) {
 $("txPanel").hidden=false;$("txTitle").textContent=title;$("txStatus").textContent=description;
 $("txLink").hidden=!hash;
 if(hash)$("txLink").href=EXPLORER+hash;
}
function knownScope(address){return address===RELYNX?"relynx":address===GATE?"gate":null;}
async function read(address,functionName,args=[]) {
 const scope=knownScope(address);
 if (!scope) throw new Error("Unsupported contract address");
 const query=new URLSearchParams({scope,method:functionName});
 if(args.length)query.set("id",String(args[0]));
 const response=await fetch("/api/read?"+query.toString(),{cache:"no-store"});
 let body;
 try{body=await response.json();}catch{throw new Error("Unexpected read service response");}
 if(!response.ok)throw new Error(body?.error||("Read service returned HTTP "+response.status));
 return body.value;
}
function highlightClaim(id){$("preset2").classList.toggle("active",id===2);$("preset3").classList.toggle("active",id===3);$("claimId").value=String(id);}
function setGateChoice(id){
 gateClaim=id;gateAllowed=false;$("actionClaim").value=String(id);
 $("choose2").classList.toggle("active",id===2);$("choose3").classList.toggle("active",id===3);
 $("choose2").setAttribute("aria-pressed",String(id===2));$("choose3").setAttribute("aria-pressed",String(id===3));
 const status=$("eligibility");status.textContent="Claim #"+id+" selected. Check live eligibility before signing.";status.className="eligibility";
 updateSignButton();
}
function updateSignButton(){
 const button=$("signAction");button.disabled=locked||!wallet||!gateAllowed;
 button.textContent=locked?"Transaction in progress…":!wallet?"Connect wallet to sign":!gateAllowed?"Check eligibility first":"Sign & store receipt";
}
async function checkGate(){
 gateAllowed=false;updateSignButton();
 const status=$("eligibility");status.className="eligibility";status.textContent="Checking current on-chain eligibility…";
 const id=gateClaim;
 try {
  const result=await read(GATE,"can_act",[id]);
  if(gateClaim!==id)return;
  gateAllowed=result===true;
  status.className="eligibility "+(gateAllowed?"allowed":"blocked");
  status.textContent=gateAllowed?
   "ALLOWED · Claim #"+id+" is eligible. You can sign an on-chain action.":
   "BLOCKED · Claim #"+id+" cannot be used by this Consumer Gate. No signature needed.";
 }catch(error){
  status.className="eligibility blocked";status.textContent="Cannot verify eligibility: "+errText(error);
 }
 updateSignButton();
}
async function loadClaim(rawId){
 const id=Number(rawId);
 if(!Number.isSafeInteger(id)||id<1){setRead("Enter a valid claim ID.","error");return;}
 selected=id;highlightClaim(id);
 const box=$("claimDetails");box.textContent="Loading Claim #"+id+"…";
 try{
  const results=await Promise.allSettled([
    read(RELYNX,"claim_status",[id]),
    read(GATE,"can_act",[id])
  ]);
  if(results[0].status!=="fulfilled")throw results[0].reason;
  const c=toObject(results[0].value);
  const canAct=results[1].status==="fulfilled"?results[1].value:null;
  box.replaceChildren();
  const head=element("div",undefined,"detail-top");
  head.append(element("strong","Claim #"+id));
  const trusted=c.can_rely===true;
  head.append(element("span",trusted?"RELIABLE":"NOT RELIABLE","pill "+(trusted?"ok":"block")));
  box.append(head);
  const dl=element("dl",undefined,"meta");
  pair(dl,"Statement",c.statement);pair(dl,"Current state",c.state);
  pair(dl,"AI decision",c.last_decision||"Not reviewed");
  pair(dl,"Can rely",trusted?"YES":"NO");
  pair(dl,"Consumer Gate",canAct===null?"Unable to check":canAct===true?"ALLOWED":"BLOCKED");
  pair(dl,"Depends on",[(c.parent_a||null),(c.parent_b||null)].filter(Boolean).map(x=>"#"+x).join(", ")||"Independent");
  pair(dl,"Repository",c.repo);pair(dl,"Issuer",short(c.issuer));pair(dl,"Claim key",c.key);
  box.append(dl);
  const foot=element("div","Live finalized state · RELYNX contract 0x69c3…176Fa","detail-note");box.append(foot);
  if(id===2||id===3){
   const b=$(id===2?"preset2":"preset3");b.classList.toggle("blocked",!trusted);b.classList.toggle("allowed",trusted);
   $(id===2?"state2":"state3").textContent=(canAct===null?"Gate unavailable":canAct?"Gate ALLOWED":"Gate BLOCKED");
  }
 }catch(error){box.replaceChildren(element("div","Unable to load Claim #"+id+": "+errText(error),"eligibility blocked"));}
}
function showReceipt(v){
 const box=$("receiptDetails");box.replaceChildren();
 const d=toObject(v);
 const headline=element("div",undefined,"detail-top");
 headline.append(element("strong","Receipt #"+d.receipt_id),element("span","STORED ON-CHAIN","pill ok"));
 box.append(headline);
 const dl=element("dl",undefined,"meta");
 pair(dl,"Claim", "#"+d.claim_id);pair(dl,"Action",d.action_key);
 pair(dl,"Signer",d.actor);pair(dl,"Receipt ID",d.receipt_id);
 box.append(dl);
}
async function refresh(){
 const token=++refreshToken;
 setRead("Reading latest finalized data from Studionet…");
 const [claims,receipts]=await Promise.allSettled([read(RELYNX,"claim_count"),read(GATE,"receipt_count")]);
 if(token!==refreshToken)return;
 let ok=0;const failures=[];
 if(claims.status==="fulfilled"&&Number.isFinite(Number(claims.value))){
  const n=Number(claims.value);$("claimCount").textContent=String(n);ok++;
 }else{ $("claimCount").textContent="Unavailable"; failures.push("claim counter"); }
 if(receipts.status==="fulfilled"&&Number.isFinite(Number(receipts.value))){
  const n=Number(receipts.value);$("receiptCount").textContent=String(n);ok++;
  if(n>0){
    try{showReceipt(await read(GATE,"receipt",[n]));}
    catch(e){$("receiptDetails").textContent="Receipt #"+n+" could not load: "+errText(e);}
  }else $("receiptDetails").textContent="No stored receipts yet.";
 }else{
  $("receiptCount").textContent="Unavailable";failures.push("receipt counter");
  $("receiptDetails").textContent="Receipt data is unavailable. Use Retry or check the RPC connection.";
 }
 if(token!==refreshToken)return;
 if(ok===2)setRead("Live finalized contract data loaded.","success");
 else setRead("Read problem: "+failures.join(", ")+". Retry or check GenLayer Studio.","error");
 await loadClaim(selected);
}
async function connectWallet(){
 if(wallet){
  wallet=null;account=null;$("walletState").textContent="Read-only mode";$("connectWallet").textContent="Connect wallet";
  gateAllowed=false;$("eligibility").textContent="Disconnected. Check eligibility before signing again.";updateSignButton();
  return;
 }
 const provider=window.ethereum;
 if(!provider){tx("Wallet required","Install or enable an EIP-1193 wallet for signed testnet actions.");return;}
 const button=$("connectWallet");button.disabled=true;button.textContent="Connecting…";
 try {
  const accounts=await provider.request({method:"eth_requestAccounts"});
  if(!accounts?.[0])throw new Error("Wallet did not return an account");
  const candidate=createClient({chain:studionet,account:accounts[0],provider});
  await candidate.connect("studionet");
  wallet=candidate;account=accounts[0];
  $("walletState").textContent=short(account);button.textContent="Disconnect";
  tx("Wallet connected","Connected as "+short(account)+". GenLayer Studionet · 61999.");
 }catch(error){
  wallet=null;account=null;button.textContent="Connect wallet";
  tx("Wallet connection failed",errText(error));
 }finally{button.disabled=false;updateSignButton();}
}
async function write(address,functionName,args){
 if(locked)return;
 if(!wallet||!account){tx("Connect wallet first","Connect a wallet on GenLayer Studionet to sign.");return;}
 locked=true;latestHash=null;updateSignButton();
 const request={address,functionName,args};
 try {
  tx("Preparing transaction","Checking fees before requesting your wallet signature…");
  const fees=await wallet.estimateTransactionFeesForWrite(request);
  tx("Confirm in wallet","Check your wallet popup and approve only if the details are correct.");
  const hash=await wallet.writeContract({...request,fees:{distribution:fees.distribution,feeValue:fees.feeValue}});
  latestHash=hash;tx("Submitted to GenLayer","Waiting for finalization; do not submit a duplicate.",hash);
  let receipt;
  try{receipt=await reader.waitForFinalization({hash});}
  catch(error){
   tx("Transaction submitted · status unknown","The transaction hash exists but finality could not be confirmed: "+errText(error)+". Check Explorer; do not sign again.",hash);
   return;
  }
  if(!isSuccessful(receipt)){
   tx("Execution rolled back","Transaction finalized but GenVM did not return success. "+(receipt.txExecutionResultName||receipt.statusName||"")+" · inspect Explorer.",hash);
   return;
  }
  tx("Transaction successful","Finalized and executed successfully. Reloading state and receipt…",hash);
  await refresh();
  if(functionName==="perform_action"){
    await checkGate();
    document.querySelector("#gate")?.scrollIntoView({behavior:"smooth",block:"center"});
  }
 }catch(error){
  tx(latestHash?"Transaction status uncertain":"Wallet / fee error",errText(error)+(latestHash?" · Check Explorer before any retry.":""));
 }finally{locked=false;updateSignButton();}
}
$("refresh").onclick=refresh;
$("refreshClaims").onclick=refresh;
$("loadClaim").onclick=()=>loadClaim($("claimId").value);
$("claimId").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();loadClaim($("claimId").value);}};
$("preset2").onclick=()=>loadClaim(2);
$("preset3").onclick=()=>loadClaim(3);
$("choose2").onclick=()=>setGateChoice(2);
$("choose3").onclick=()=>setGateChoice(3);
$("connectWallet").onclick=connectWallet;
$("dismissTx").onclick=()=>{$("txPanel").hidden=true;};
$("checkAction").onclick=checkGate;
$("actionForm").onsubmit=async e=>{
 e.preventDefault();
 if(!wallet){tx("Wallet required","Connect your wallet to sign a permitted action.");return;}
 await checkGate();
 if(!gateAllowed){tx("Action blocked","Consumer Gate did not confirm eligibility. No transaction was submitted.");return;}
 const key=$("actionKey").value.trim();
 if(!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(key)){tx("Invalid action reference","Use 3–40 lowercase letters, digits, - or _.");return;}
 await write(GATE,"perform_action",[gateClaim,key]);
};
$("registerForm").onsubmit=e=>{
 e.preventDefault();
 const args=[$("repoOwner").value.trim(),$("repoName").value.trim(),$("claimKey").value.trim(),$("claimStatement").value.trim(),Number($("parentA").value),Number($("parentB").value)];
 if(args[3].length<32){tx("Invalid claim","Statement must be at least 32 characters.");return;}
 write(RELYNX,"register_claim",args);
};
$("noticeForm").onsubmit=e=>{
 e.preventDefault();
 const commit=$("noticeCommit").value.trim(),digest=$("noticeDigest").value.trim();
 if(!/^[0-9a-f]{40}$/.test(commit)||!/^[0-9a-f]{64}$/.test(digest)){tx("Invalid notice","Use the full lowercase commit SHA and exact SHA-256 digest.");return;}
 if(!window.confirm("This GenLayer review can permanently revoke a claim. Submit the notice?"))return;
 write(RELYNX,"review_notice",[Number($("noticeClaim").value),commit,digest]);
};
window.ethereum?.on?.("accountsChanged",()=>{wallet=null;account=null;gateAllowed=false;$("walletState").textContent="Wallet changed · reconnect";$("connectWallet").textContent="Connect wallet";updateSignButton();});
window.ethereum?.on?.("chainChanged",()=>{wallet=null;account=null;gateAllowed=false;$("walletState").textContent="Network changed · reconnect";$("connectWallet").textContent="Connect wallet";updateSignButton();});
setGateChoice(3);
refresh().then(()=>checkGate());
