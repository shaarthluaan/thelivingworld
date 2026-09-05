import {WebSocketServer,WebSocket} from 'ws';
import {TikTokLiveConnection,WebcastEvent,ControlEvent} from '../dist/index.js';

const username=process.argv[2]?.replace(/^@/,'');
if(!username){console.error('Usage: npm run game:bridge -- @live_username');process.exit(1)}
const port=Number(process.env.GAME_BRIDGE_PORT||8787),wss=new WebSocketServer({port});
let connection=null,reconnectTimer=null,stopping=false,attempt=0,sequence=0;
const status={status:'DISCONNECTED',username,eventsReceived:0,eventsProcessed:0,eventsIgnored:0,eventsFailed:0,lastEvent:'—',lastEventTime:null,queue:0,error:null};
const broadcast=packet=>{const json=JSON.stringify(packet);for(const client of wss.clients)if(client.readyState===WebSocket.OPEN)client.send(json)};
const publishStatus=()=>broadcast({kind:'status',status});
const text=v=>v===undefined||v===null?'':String(v);
const number=v=>Number.isFinite(Number(v))?Number(v):undefined;
const eventId=(type,data,userId,extra='')=>{const id=data?.common?.msgId??data?.msgId;if(id!==undefined&&id!==null&&String(id))return String(id);const at=data?.common?.createTime??data?.createTime??data?.timestamp;return `${type}:${userId||'anon'}:${extra}:${at??++sequence}`};
const userOf=data=>({userId:text(data?.user?.userId||data?.user?.idStr||data?.user?.uniqueId)||'anonymous',username:text(data?.user?.nickname||data?.user?.uniqueId)||'Visitante'});
function emit(type,data,extra={}){try{const user=userOf(data),event={id:eventId(type,data,user.userId,extra.giftId||extra.comment||extra.likeCount||''),type,...user,timestamp:number(data?.common?.createTime??data?.createTime)??Date.now(),...extra};status.eventsReceived++;status.eventsProcessed++;status.lastEvent=type.toUpperCase();status.lastEventTime=Date.now();broadcast({kind:'event',event});publishStatus()}catch(err){status.eventsFailed++;status.error='Could not normalize TikTok event';publishStatus()}}
function scheduleReconnect(){if(stopping||reconnectTimer)return;const delay=Math.min(60000,1000*2**attempt++);status.status='RECONNECTING';publishStatus();reconnectTimer=setTimeout(()=>{reconnectTimer=null;connect()},delay)}
function connect(){if(stopping||connection?.isConnected||connection?.isConnecting)return;status.status='CONNECTING';status.error=null;publishStatus();connection=new TikTokLiveConnection(username,{enableExtendedGiftInfo:true});
 connection.on(ControlEvent.CONNECTED,()=>{attempt=0;status.status='CONNECTED';publishStatus()});
 connection.on(ControlEvent.DISCONNECTED,()=>{status.status='DISCONNECTED';publishStatus();scheduleReconnect()});
 connection.on(ControlEvent.ERROR,()=>{status.eventsFailed++;status.error='TikTok connector error';publishStatus()});
 connection.on(WebcastEvent.MEMBER,data=>emit('join',data));
 connection.on(WebcastEvent.FOLLOW,data=>emit('follow',data));
 connection.on(WebcastEvent.SHARE,data=>emit('share',data));
 connection.on(WebcastEvent.LIKE,data=>emit('like',data,{likeCount:number(data?.likeCount)??1}));
 connection.on(WebcastEvent.CHAT,data=>emit('comment',data,{comment:text(data?.comment)}));
 connection.on(WebcastEvent.GIFT,data=>emit('gift',data,{giftId:data?.giftId===undefined?'':String(data.giftId),giftName:text(data?.gift?.name||data?.extendedGiftInfo?.name),diamondCount:number(data?.gift?.diamondCount??data?.extendedGiftInfo?.diamond_count),repeatCount:number(data?.repeatCount)??1,repeatEnd:Number(data?.repeatEnd)!==0}));
 connection.connect().catch(()=>{status.status='DISCONNECTED';status.error='Unable to connect to TikTok LIVE';publishStatus();scheduleReconnect()});
}
wss.on('connection',socket=>{socket.send(JSON.stringify({kind:'status',status}))});
wss.on('error',err=>console.error('Bridge WebSocket server error:',err.message));
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
async function shutdown(){if(stopping)return;stopping=true;if(reconnectTimer)clearTimeout(reconnectTimer);try{await connection?.disconnect()}catch{}wss.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000)}
console.log(`Game bridge listening on ws://localhost:${port} for @${username}`);connect();
