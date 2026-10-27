'use strict';
function isAgentLink(value){
  try{const url=new URL(value);return url.protocol==='classjourney:'&&url.hostname==='connect'&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash&&['','/'].includes(url.pathname);}catch{return false;}
}
module.exports={isAgentLink};
