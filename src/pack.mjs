export function makeZip(files){
  const encoder=new TextEncoder(),table=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
  const crc=b=>{let c=0xffffffff;for(const v of b)c=table[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
  const chunks=[],central=[];let offset=0,centralSize=0;
  const header=size=>{const a=new Uint8Array(size);return[a,new DataView(a.buffer)];};
  for(const file of files){
    const name=encoder.encode(file.name),bytes=typeof file.content==='string'?encoder.encode(file.content):file.content;
    if(!(bytes instanceof Uint8Array))throw new Error('Ungültiger Dateiinhalt.');
    const checksum=crc(bytes),[local,l]=header(30+name.length);
    l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint16(12,0x21,true);l.setUint32(14,checksum,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);chunks.push(local,bytes);
    const [entry,c]=header(46+name.length);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(14,0x21,true);c.setUint32(16,checksum,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);central.push(entry);centralSize+=entry.length;offset+=local.length+bytes.length;
  }
  const [end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
  const out=new Uint8Array(offset+centralSize+22);let at=0;for(const b of [...chunks,...central,end]){out.set(b,at);at+=b.length;}return out;
}
