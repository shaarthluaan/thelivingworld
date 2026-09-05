import {EventQueue} from './EventQueue.js';

// Browser-side adapter. It knows only the bridge JSON contract, never the Node SDK.
export class TikTokEventProvider {
 constructor(bus,{url='ws://localhost:8787',queueLimit=20000,batchSize=250,socketFactory=globalThis.WebSocket,autoStart=true}={}){
  this.bus=bus;this.url=url;this.batchSize=batchSize;this.socketFactory=socketFactory;this.queue=new EventQueue(queueLimit);this.socket=null;
  this.state={status:'DISCONNECTED',username:'',eventsReceived:0,eventsProcessed:0,eventsIgnored:0,eventsFailed:0,lastEvent:'—',lastEventTime:null,queue:0,error:null};
  if(autoStart)this.start();
 }
 start(){if(this.socket||!this.socketFactory)return;this.state.status='CONNECTING';this.notify();try{const socket=this.socket=new this.socketFactory(this.url);socket.onopen=()=>{this.state.status='CONNECTED';this.state.error=null;this.notify()};socket.onmessage=e=>this.receive(e.data);socket.onerror=()=>{this.state.error='WebSocket bridge error';this.notify()};socket.onclose=()=>{this.socket=null;this.state.status='DISCONNECTED';this.notify();setTimeout(()=>this.start(), 5000);}}catch(err){this.state.status='ERROR';this.state.error=String(err);this.notify();setTimeout(()=>this.start(), 5000);}}
 stop(){const socket=this.socket;this.socket=null;if(socket?.close)socket.close();this.state.status='DISCONNECTED';this.notify()}
 receive(message){try{const packet=typeof message==='string'?JSON.parse(message):message;if(!packet||typeof packet!=='object')return this.ignore();if(packet.kind==='status'){this.state={...this.state,...packet.status,queue:this.queue.length};this.notify();return}if(packet.kind!=='event'||!packet.event)return this.ignore();this.state.eventsReceived++;this.state.lastEvent=packet.event.type||'UNKNOWN';this.state.lastEventTime=Date.now();if(!this.queue.push(packet.event))this.ignore();this.state.queue=this.queue.length;this.notify()}catch{this.ignore()}}
 flush(){const done=this.queue.drain(this.batchSize,event=>{try{this.bus.emit('external',event);this.state.eventsProcessed++}catch{this.state.eventsFailed++}});this.state.queue=this.queue.length;if(done)this.notify();return done}
 ignore(){this.state.eventsIgnored++;this.notify()}
 getStatus(){return {...this.state,queue:this.queue.length}}
 notify(){this.bus.emit('providerStatus',this.getStatus())}
}
