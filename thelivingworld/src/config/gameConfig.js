export const CONFIG = Object.freeze({
  season:{id:'season-001',durationMs:1000*60*60*24*30},
  eras:[
    {name:'Descoberta',threshold:0,color:'#7fcf7a',buildings:['Acampamento']},
    {name:'Fundação',threshold:150,color:'#83c8e8',buildings:['Oficina','Ponte']},
    {name:'Expansão',threshold:500,color:'#f4bb65',buildings:['Casas','Mercado']},
    {name:'Prosperidade',threshold:1200,color:'#e88d70',buildings:['Torre','Jardins']},
    {name:'Mistério',threshold:2500,color:'#a68be8',buildings:['Observatório','Templo']},
    {name:'Ameaça',threshold:4500,color:'#d86778',buildings:['Muralha','Farol']},
    {name:'Ascensão',threshold:7500,color:'#ffe08b',buildings:['Portal Celeste','Palácio']}
  ],
  giftTiers:[{min:1,max:9,points:8},{min:10,max:49,points:30},{min:50,max:199,points:110},{min:200,max:999,points:400,effect:true},{min:1000,max:Infinity,points:1200,effect:true,special:true}],
  likesPerEnergy:100,likeAggregationMs:800,maxEventIds:5000,maxScore:100000000,maxNameLength:32,maxQueue:20000,
  titles:[{name:'Lenda',field:'contribution',min:3000},{name:'Arquiteto',field:'contribution',min:800},{name:'Guardião',field:'defense',min:250},{name:'Explorador',field:'exploration',min:250},{name:'Pioneiro',field:'contribution',min:150},{name:'Veterano',field:'level',min:8}],
  globalEvents:{storm:{duration:60000,goal:300,reward:250},invasion:{duration:75000,goal:700,reward:600},meteor:{duration:18000},eclipse:{duration:22000},rain:{duration:20000}}
});
