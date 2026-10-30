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
  return res.status(200).json({found:true,status,execution});
 }catch(e){
  return res.status(502).json({error:e instanceof Error?e.message.slice(0,200):"Transaction RPC lookup failed"});
 }
}
