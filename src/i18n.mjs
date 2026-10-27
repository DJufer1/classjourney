import TRANSLATIONS from '../content/translations.json' with {type:'json'};
export const UI_LANGUAGES={de:'Deutsch',en:'English',fr:'Français',es:'Español',it:'Italiano'};
export const normalizedLanguage=value=>Object.hasOwn(UI_LANGUAGES,value)?value:'de';
let uiLanguage='de';
export function setUiLanguage(value){uiLanguage=normalizedLanguage(value);return uiLanguage;}
export function getUiLanguage(){return uiLanguage;}
export function uiLocale(){return {de:'de-CH',en:'en-GB',fr:'fr-CH',es:'es-ES',it:'it-CH'}[uiLanguage];}
export function dayLabel(day){return new Intl.DateTimeFormat(uiLocale(),{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2026,0,4+day)));}
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function normalizedMessage(value){const slots=[];const key=decode(value.trim().replace(/\s+/g,' ')).replace(/__CJ_SLOT_(\d+)__/g,match=>{let index=slots.indexOf(match);if(index<0){index=slots.length;slots.push(match);}return '{'+index+'}';});return {key,slots};}
const htmlEscape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
export function translateText(message,language=uiLanguage){return TRANSLATIONS[language]?.[message]??message;}
export function formatMessage(key,values,language=uiLanguage){return translateText(key,language).replace(/\{(\d+)\}/g,(_match,index)=>String(values[index]??''));}
function segment(value,escape){
  if(uiLanguage==='de'||!value.trim())return value;
  const {key,slots}=normalizedMessage(value),translated=TRANSLATIONS[uiLanguage]?.[key];if(translated===undefined)return value;
  const start=value.match(/^\s*/)[0],end=value.match(/\s*$/)[0];
  let text=escape?htmlEscape(translated):translated;
  text=text.replace(/\{(\d+)\}/g,(_match,index)=>slots[index]??_match);return start+text+end;
}
export function uiString(value){
  if(typeof value!=='string'||uiLanguage==='de')return value;
  if(!/<[a-zA-Z/]/.test(value))return segment(value,false);
  return value.replace(/(\b(?:title|aria-label|placeholder|alt)\s*=\s*)(["'])([\s\S]*?)\2/g,(_all,prefix,quote,text)=>prefix+quote+segment(text,true)+quote).replace(/(^|>)([^<>]+)(?=<|$)/g,(_all,prefix,text)=>prefix+segment(text,true));
}
export function tr(value){return uiString(value);}
export function localizedDemo(plan){if(!plan||!plan.isDemo||plan.id!=='demo-tag'||plan.updatedAt>3)return plan;return {...plan,title:tr(plan.title),topic:tr(plan.topic),activities:plan.activities.map(activity=>({...activity,title:tr(activity.title),description:tr(activity.description)}))};}
const templates=new WeakMap();
export function ui(strings,...values){
  let cache=templates.get(strings);if(!cache){cache={};templates.set(strings,cache);}
  let skeleton=cache[uiLanguage];if(skeleton===undefined){skeleton=strings.reduce((text,part,index)=>text+part+(index<values.length?'__CJ_SLOT_'+index+'__':''),'');skeleton=uiString(skeleton);cache[uiLanguage]=skeleton;}
  return skeleton.replace(/__CJ_SLOT_(\d+)__/g,(_match,index)=>String(values[index]));
}
export function uiMessageSegments(value){
  const found=[];const add=text=>{const {key}=normalizedMessage(text);if(/[A-Za-zÀ-ž]/.test(key.replace(/\{\d+\}/g,'')))found.push(key);};
  if(!/<[a-zA-Z/]/.test(value)){add(value);return found;}
  value.replace(/\b(?:title|aria-label|placeholder|alt)\s*=\s*(["'])([\s\S]*?)\1/g,(_all,_quote,text)=>{add(text);return _all;});
  value.replace(/(^|>)([^<>]+)(?=<|$)/g,(_all,_prefix,text)=>{add(text);return _all;});return found;
}
