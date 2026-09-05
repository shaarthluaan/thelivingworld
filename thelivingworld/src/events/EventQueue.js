export class EventQueue {
 constructor(limit=20000){this.limit=limit;this.items=[];this.dropped=0}
 push(event){if(this.items.length>=this.limit){this.dropped++;return false}this.items.push(event);return true}
 drain(max,handler){let count=0;while(count<max&&this.items.length){handler(this.items.shift());count++}return count}
 get length(){return this.items.length}
}
