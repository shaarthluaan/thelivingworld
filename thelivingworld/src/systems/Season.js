export function newSeason(config,id=`season-${Date.now()}`){const start=Date.now();return {id,start,end:start+config.season.durationMs,progress:0,era:1,winners:[]}}
