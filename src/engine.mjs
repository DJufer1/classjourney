export const DAYS = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
export const DEFAULT_LESSONS = [{"number":1,"start":"08:15","end":"09:00"},{"number":2,"start":"09:00","end":"09:45"},{"number":3,"start":"10:15","end":"11:00"},{"number":4,"start":"11:05","end":"11:50"},{"number":5,"start":"11:55","end":"12:40"},{"number":6,"start":"13:45","end":"14:30"},{"number":7,"start":"14:35","end":"15:20"},{"number":8,"start":"15:35","end":"16:20"},{"number":9,"start":"16:25","end":"17:10","marker":"*"},{"number":10,"start":"17:15","end":"18:00","startAssumed":true}];
export const ICONS = {idea:0,puzzle:1,break:2,notebook:3,talk:4,check:5,health:6,hygiene:7,care:8,mobility:9,resources:10,rest:11};
export function defaultLessonSlots(numbers=DEFAULT_LESSONS.map(l=>l.number)){
  if(!Array.isArray(numbers)||numbers.some(n=>!DEFAULT_LESSONS.some(l=>l.number===n)))throw new Error('Unbekannte Standardlektion.');
  return DEFAULT_LESSONS.filter(l=>numbers.includes(l.number)).map(l=>({start:l.start,end:l.end}));
}
export function minutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new Error('Bitte eine gültige Uhrzeit eingeben.');
  const [h,m]=value.split(':').map(Number);
  if(h>23||m>59) throw new Error('Bitte eine gültige Uhrzeit eingeben.');
  return h*60+m;
}
export function timeLabel(value) {
  const m=Math.round(value), day=Math.floor(m/1440);
  return `${String(Math.floor((m%1440+1440)%1440/60)).padStart(2,'0')}:${String((m%60+60)%60).padStart(2,'0')}${day>0?' +'+day+' T.':''}`;
}
export function slotList(plan) {
  if(!Array.isArray(plan.slots)||!plan.slots.length) throw new Error('Mindestens eine Unterrichtszeit ist nötig.');
  const slots=plan.slots.map(s=>({start:minutes(s.start),end:minutes(s.end)})).sort((a,b)=>a.start-b.start);
  for(let i=0;i<slots.length;i++){
    if(slots[i].end<=slots[i].start) throw new Error('Das Ende einer Lektion muss nach ihrem Beginn liegen.');
    if(i&&slots[i].start<slots[i-1].end) throw new Error('Unterrichtszeiten dürfen sich nicht überschneiden.');
  }
  return slots;
}
export function schedule(plan) {
  const slots=slotList(plan), segments=[], activities=[];
  let slotIndex=0,cursor=slots[0].start;
  for(const activity of plan.activities){
    if(!Number.isInteger(activity.duration)||activity.duration<1||activity.duration>1440) throw new Error('Auftragszeiten müssen zwischen 1 und 1440 Minuten liegen.');
    let left=activity.duration,part=0;
    const entry={activity,segments:[],overflow:0,start:0,end:0};
    while(left>0){
      while(slotIndex<slots.length&&cursor>=slots[slotIndex].end){
        slotIndex++;
        if(slotIndex<slots.length) cursor=Math.max(cursor,slots[slotIndex].start);
      }
      const overflow=slotIndex>=slots.length;
      const amount=overflow?left:Math.min(left,slots[slotIndex].end-cursor);
      const segment={id:`${activity.id}-${part++}`,activityId:activity.id,activity,start:cursor,end:cursor+amount,duration:amount,overflow,kind:'activity'};
      const previous=entry.segments.at(-1);
      if(previous&&previous.end===segment.start&&previous.overflow===segment.overflow){previous.end=segment.end;previous.duration+=amount;}
      else{segments.push(segment);entry.segments.push(segment);}
      if(overflow)entry.overflow+=amount;
      cursor+=amount;left-=amount;
    }
    entry.start=entry.segments[0].start;entry.end=entry.segments.at(-1).end;
    activities.push(entry);
  }
  for(let i=0;i<slots.length-1;i++){
    if(slots[i+1].start>slots[i].end)segments.push({id:`fixed-break-${i}`,start:slots[i].end,end:slots[i+1].start,duration:slots[i+1].start-slots[i].end,kind:'fixed-break',overflow:false,activity:{title:'Lektionspause',description:'Zeit zum Durchatmen.',icon:'break',duration:slots[i+1].start-slots[i].end}});
  }
  segments.sort((a,b)=>a.start-b.start||a.end-b.end);
  let y=0;
  for(const segment of segments){segment.y=y;segment.height=Math.max(segment.kind==='fixed-break'?112:152,segment.duration*6);y+=segment.height+16;}
  return {segments,activities,slots,start:slots[0].start,end:slots.at(-1).end,contentEnd:activities.at(-1)?.end??slots[0].start,totalHeight:y,available:slots.reduce((n,s)=>n+s.end-s.start,0),planned:plan.activities.reduce((n,a)=>n+a.duration,0),overflow:activities.reduce((n,a)=>n+a.overflow,0)};
}
export function atTime(data,now){return data.segments.find(s=>s.start<=now&&now<s.end)||null;}
export function positionAt(data,now){
  const ss=data.segments;if(!ss.length)return 0;
  if(now<ss[0].start)return ss[0].y+Math.max(-100,(now-ss[0].start)*4);
  for(let i=0;i<ss.length;i++){
    const s=ss[i];
    if(now<s.end)return s.y+Math.max(0,(now-s.start)/s.duration)*s.height;
    if(i<ss.length-1&&now<ss[i+1].start)return s.y+s.height+(now-s.end)/(ss[i+1].start-s.end)*16;
  }
  const last=ss.at(-1);return last.y+last.height+Math.min(240,(now-last.end)*4);
}
export function remaining(data,activityId,now){
  const a=data.activities.find(a=>a.activity.id===activityId);
  return a?a.segments.reduce((n,s)=>n+Math.max(0,s.end-Math.max(s.start,now)),0):0;
}
export function safeImage(value){return typeof value==='string'&&/^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=\s]+$/.test(value)&&value.length<24000000?value:'';}
export function validateCollection(raw){
  if(!raw||raw.format!=='classroomscreen'||raw.version!==1||!Array.isArray(raw.plans))throw new Error('Diese Datei ist keine unterstützte Classroomscreen-Sammlung.');
  if(raw.plans.length>1000)throw new Error('Eine Sammlung darf höchstens 1000 Pläne enthalten.');
  const str=(v,n=500)=>String(v??'').slice(0,n);
  const validId=v=>/^[a-zA-Z0-9_-]{1,100}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);
  const seen=new Set();
  const plans=raw.plans.map(p=>{
    const id=str(p.id,100);if(!validId(id)||seen.has(id))throw new Error('Plan-Kennungen sind ungültig oder doppelt.');seen.add(id);
    if(!Array.isArray(p.activities)||p.activities.length>300)throw new Error('Ein Plan darf höchstens 300 Aufträge enthalten.');
    const actIds=new Set();
    const activities=p.activities.map(a=>{
      const aid=str(a.id,100);if(!validId(aid)||actIds.has(aid))throw new Error('Auftrags-Kennungen sind ungültig oder doppelt.');actIds.add(aid);
      const duration=Number(a.duration);if(!Number.isInteger(duration)||duration<1||duration>1440)throw new Error('Ungültige Auftragsdauer.');
      return {id:aid,title:str(a.title,180)||'Auftrag',description:str(a.description,2000),duration,icon:Object.hasOwn(ICONS,a.icon)?a.icon:'notebook',image:safeImage(a.image)};
    });
    const date=/^\d{4}-\d{2}-\d{2}$/.test(p.date||'')?p.date:'';
    if(date){const d=new Date(date+'T12:00:00');if(!Number.isFinite(d.getTime())||`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`!==date)throw new Error('Ein Plan enthält ein ungültiges Datum.');}
    const weekday=date?new Date(date+'T12:00:00').getDay():Math.max(0,Math.min(6,Number(p.weekday)||0));
    const plan={id,title:str(p.title,180)||'Unterrichtstag',className:str(p.className,80)||'Meine Klasse',topic:str(p.topic,140)||'Allgemein',date,weekday,slots:(p.slots||[]).map(s=>({start:str(s.start,5),end:str(s.end,5)})),activities,backgroundId:str(p.backgroundId,100)||'journey',example:!!p.example,updatedAt:Number(p.updatedAt)||0};
    slotList(plan);return plan;
  });
  const backgrounds={};for(const [key,item] of Object.entries(raw.assets?.backgrounds||{})){const src=safeImage(item.src);if(src&&validId(key))backgrounds[key]={name:str(item.name,100),src,prompt:str(item.prompt,5000)};}
  return {format:'classroomscreen',version:1,libraryId:str(raw.libraryId,120)||'classjourney',modifiedAt:Number(raw.modifiedAt)||0,plans,assets:{backgrounds,atlas:safeImage(raw.assets?.atlas),fageAtlas:safeImage(raw.assets?.fageAtlas)},settings:{motion:raw.settings?.motion!==false,backgroundOpacity:Math.max(0,Math.min(0.65,Number.isFinite(Number(raw.settings?.backgroundOpacity))?Number(raw.settings.backgroundOpacity):0.32))}};
}
