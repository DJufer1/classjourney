import {parse} from 'acorn';
import {uiMessageSegments,normalizedMessage} from '../src/i18n.mjs';
const plainUi=value=>value.length<3000&&!/\.(?:html|json|png|jpg|zip|md|py|txt)$/i.test(value)&&(/^[A-ZÀ-Þ][a-zà-ž]/.test(value)||/[äöüÄÖÜß]/.test(value)||/\b(?:bitte|min|von|für|nicht|mit|wird|werden|ausserhalb)\b/.test(value));
function walk(node,visit,ancestors=[]){if(!node||typeof node!=='object')return;if(node.type)visit(node,ancestors);for(const [key,value]of Object.entries(node)){if(['start','end','loc'].includes(key))continue;if(Array.isArray(value))value.forEach(child=>walk(child,visit,node.type?[...ancestors,node]:ancestors));else if(value&&typeof value==='object')walk(value,visit,node.type?[...ancestors,node]:ancestors);}}
const skeleton=node=>node.quasis.map((part,index)=>(part.value.cooked??part.value.raw)+(index<node.expressions.length?'__CJ_SLOT_'+index+'__':'')).join('');
export function extractUiMessages(source){const found=new Set();walk(parse(source,{ecmaVersion:'latest',sourceType:'module'}),(node,parents)=>{
  const parent=parents.at(-1);if(node.type==='Literal'&&typeof node.value==='string'&&!(parent?.type==='Property'&&parent.key===node&&!parent.computed)){
    if(/<[a-zA-Z/]/.test(node.value)||plainUi(node.value))for(const message of uiMessageSegments(node.value))found.add(message);
  }else if(node.type==='TemplateLiteral')for(const message of uiMessageSegments(skeleton(node)))if(plainUi(message)||/[<>]/.test(skeleton(node)))found.add(message);
});return [...found];}
export function compileUi(source,keys){const edits=[];walk(parse(source,{ecmaVersion:'latest',sourceType:'module'}),(node,parents)=>{
  const parent=parents.at(-1),icons=parents.some(ancestor=>ancestor.type==='VariableDeclarator'&&ancestor.id.name==='iconNames');
  if(node.type==='TemplateLiteral'&&parent?.type!=='TaggedTemplateExpression')edits.push({start:node.start,end:node.start,text:'ui'});
  else if(node.type==='Literal'&&typeof node.value==='string'&&!icons&&!(parent?.type==='Property'&&parent.key===node&&!parent.computed)&&!['ImportDeclaration','ExportNamedDeclaration'].includes(parent?.type)&&(keys.has(normalizedMessage(node.value).key)||/<[a-zA-Z/]/.test(node.value)))edits.push({start:node.start,end:node.end,text:'tr('+source.slice(node.start,node.end)+')'});
});for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);return source;}
