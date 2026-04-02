import { useState } from "react";

export default function App(){
  const [entries,setEntries]=useState([]);

  const add=(v)=>{
    let num=parseFloat(String(v).replace(',','.'));
    if(!num)return;
    if(num>10) num=num/1000;
    if(num>5)return;
    const e={amount:num,time:new Date().toLocaleTimeString()};
    setEntries(prev=>[...prev,e]);
  };

  const total=entries.reduce((s,e)=>s+e.amount,0);

  return (
    <div style={{padding:20,fontFamily:"Arial"}}>
      <h2>Água: {total.toFixed(2)} L</h2>

      <button onClick={()=>add(0.2)}>+200ml</button>
      <button onClick={()=>add(0.5)}>+500ml</button>

      <input id="v" placeholder="ex: 700"/>
      <button onClick={()=>add(document.getElementById('v').value)}>add</button>

      <ul>
        {entries.map((e,i)=>(
          <li key={i}>{e.amount}L - {e.time}</li>
        ))}
      </ul>
    </div>
  );
}
