import { createClient } from "genlayer-stable";
import { studionet } from "genlayer-stable/chains";

const client = createClient({chain:studionet});
const PATTERN = /^0x[0-9a-fA-F]{64}$/;

export default async function handler(req, res) {
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET") return res.status(405).json({error:"GET only"});
 const hash=req.query?.hash;
 if(typeof hash!=="string"||!PATTERN.test(hash))return res.status(400).json({error:"Invalid transaction hash"});
 try {
  const transaction=await client.getTransaction({hash});
  if(!transaction)return res.status(200).json({found:false});
  const status=transaction.statusName??String(transaction.status??"UNKNOWN");
  const execution=transaction.txExecutionResultName??null;
  const consensus=transaction.consensus_data??transaction.consensusData??{};
  const leader=consensus.leader_receipt??consensus.leaderReceipt??null;
  const leaderResults=(Array.isArray(leader)?leader:[leader]).filter(Boolean).slice(0,3).map(x=>({
   execution_result:x.execution_result??x.executionResult??null,
   genvm_result:x.genvm_result??x.genvmResult??null,
   result_code:x.result?.code??null
  }));
  return res.status(200).json({found:true,status,execution,leaderResults,keys:Object.keys(transaction).filter(k=>/execution|receipt|consensus|result/i.test(k)).slice(0,20)});
 }catch(e){
  return res.status(502).json({error:e instanceof Error?e.message.slice(0,200):"Transaction RPC lookup failed"});
 }
}
