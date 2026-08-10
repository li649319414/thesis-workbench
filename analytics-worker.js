'use strict';
const norm=v=>String(v??'').toLowerCase().normalize('NFKC').replace(/\s+/g,' ').trim();
function moduleEntries(data={}){
 const out=[],push=(module,id,title,text,meta={})=>out.push({id:`${module}:${id}`,module,recordId:id,title:String(title||''),text:String(text||''),normalized:norm(`${title||''} ${text||''}`),updatedAt:meta.updatedAt||meta.createdAt||meta.date||''});
 (data.chapters||[]).forEach(c=>{push('章节',c.id,c.title,c.notes,c);(c.sections||[]).forEach(s=>push('小节',`${c.id}::${s.id}`,s.title,`${c.title} ${s.notes||''}`,s));(c.tasks||[]).forEach(t=>push('章节任务',`${c.id}::${t.id}`,t.title,`${c.title} ${t.notes||''}`,t))});
 (data.writingLogs||[]).forEach(x=>push('写作记录',x.id,`${x.words||0}字`,x.note,x));
 (data.writingRoutes||[]).forEach(x=>push('写作路线',x.id,x.title,`${x.chapterId||''} ${x.sectionId||''}`,x));
 (data.problems||[]).forEach(x=>push('问题',x.id,x.title,[x.description,x.method,x.evidence,x.resolution,x.lesson].join(' '),x));
 (data.literature||[]).forEach(x=>push('文献',x.id,x.title,[x.authors,x.journal,x.doi,x.tags,x.notes,x.citation,x.usedIn,x.researchMethod,x.keyConclusion,x.quote].join(' '),x));
 (data.feedback||[]).forEach(x=>push('修改',x.id,x.title,[x.round,x.detail,x.chapter].join(' '),x));
 (data.todos||[]).forEach(x=>push('待办',x.id,x.title,[x.notes,x.chapter,x.priority].join(' '),x));
 (data.meetings||[]).forEach(x=>push('会议',x.id,x.topic,[x.notes,x.actions,x.withWhom].join(' '),x));
 (data.figures||[]).forEach(x=>push('图表',x.id,`${x.no||''} ${x.title||''}`,[x.chapter,x.notes,x.fileName,x.sourcePath].join(' '),x));
 (data.milestones||[]).forEach(x=>push('节点',x.id,x.title,[x.date,x.status].join(' '),x));
 (data.versions||[]).forEach(x=>push('版本',x.id,x.name,[x.note,x.diffNote,x.stage].join(' '),x));
 (data.defense||[]).forEach(x=>push('答辩',x.id,x.title,[x.answer,x.notes,x.type].join(' '),x));
 return out;
}
function stats(data={}){
 const w=data.writingLogs||[], f=data.focusLogs||[];
 let words=0,mins=0; const byDate={},byHour=Array(24).fill(0),byWeekday=Array(7).fill(0);
 for(const x of w){const n=Number(x.words||0);words+=n;mins+=Number(x.minutes||0);const d=String(x.date||'').slice(0,10);byDate[d]=(byDate[d]||0)+n;const ts=x.createdAt||x.updatedAt||'';const h=Number(String(ts).slice(11,13));if(Number.isFinite(h)&&h>=0&&h<24)byHour[h]+=n; if(d){const wd=new Date(d+'T12:00:00').getDay();byWeekday[wd]+=n}}
 for(const x of f)mins+=Number(x.minutes||0);
 const dates=Object.keys(byDate).sort(), peak=dates.reduce((best,d)=>byDate[d]>(byDate[best]||-1)?d:best,dates[0]||'');
 return {words,mins,sessions:w.length,days:dates.length,peakDate:peak,peakWords:peak?byDate[peak]:0,byDate,byHour,byWeekday};
}
function health(data={}){
 const issues=[]; const ids=new Set();
 for(const [k,arr] of Object.entries(data)){if(!Array.isArray(arr))continue;for(const x of arr){if(!x?.id)issues.push({level:'warn',type:'missing-id',module:k}); else {const key=`${k}:${x.id}`;if(ids.has(key))issues.push({level:'bad',type:'duplicate-id',module:k,id:x.id});ids.add(key)}}}
 const figNos=new Map(); for(const x of data.figures||[]){const no=String(x.no||'').trim();if(no){if(figNos.has(no))issues.push({level:'warn',type:'duplicate-figure-no',value:no,ids:[figNos.get(no),x.id]});else figNos.set(no,x.id)}}
 const dois=new Map(); for(const x of data.literature||[]){const d=norm(x.doi);if(d){if(dois.has(d))issues.push({level:'warn',type:'duplicate-doi',value:x.doi,ids:[dois.get(d),x.id]});else dois.set(d,x.id)}}
 return {issues,total:issues.length,bad:issues.filter(x=>x.level==='bad').length,warn:issues.filter(x=>x.level==='warn').length};
}
self.onmessage=e=>{const {id,op,payload}=e.data||{};try{let result;if(op==='searchIndex')result=moduleEntries(payload);else if(op==='stats')result=stats(payload);else if(op==='health')result=health(payload);else throw new Error('unknown operation');self.postMessage({id,ok:true,result})}catch(err){self.postMessage({id,ok:false,error:String(err&&err.message||err)})}};
