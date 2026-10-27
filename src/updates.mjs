export const RELEASE_API='https://api.github.com/repos/DJufer1/classjourney/releases/latest';
export const INSTALLER_CHECKSUMS='ClassJourney-Installer-SHA256SUMS.txt';
export function versionParts(value){const match=String(value).match(/^v?(\d+)\.(\d+)\.(\d+)$/);if(!match)throw new Error('Ungültige Programmversion.');return match.slice(1).map(Number);}
export function compareVersions(left,right){const a=versionParts(left),b=versionParts(right);for(let i=0;i<3;i++)if(a[i]!==b[i])return a[i]>b[i]?1:-1;return 0;}
export function installerName(platform){if(platform==='win32')return 'ClassJourney-Setup-Windows-x64.exe';if(platform==='darwin')return 'ClassJourney-Mac-universal.dmg';throw new Error('Für dieses System ist kein Installer vorhanden.');}
export function releaseAsset(release,name){
  const asset=release.assets?.find(a=>a.name===name);
  const expected='https://github.com/DJufer1/classjourney/releases/download/'+encodeURIComponent(release.tag_name)+'/'+encodeURIComponent(name);
  if(!asset||asset.browser_download_url!==expected||!Number.isSafeInteger(asset.size)||asset.size<1||asset.size>1500000000)throw new Error('Der passende geprüfte Download ist noch nicht verfügbar.');
  return {name,url:expected,size:asset.size};
}
export function selectReleaseUpdate(release,currentVersion,platform){
  if(!release||release.draft||release.prerelease)throw new Error('Keine reguläre Programmversion gefunden.');
  const version=versionParts(release.tag_name).join('.');
  const available=compareVersions(version,currentVersion)>0;
  if(!available)return {available:false,version,currentVersion};
  return {available:true,version,currentVersion,installer:releaseAsset(release,installerName(platform)),checksums:releaseAsset(release,INSTALLER_CHECKSUMS)};
}
export function expectedChecksum(text,name){
  const matches=String(text).split(/\r?\n/).map(line=>line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/)).filter(match=>match&&match[2]===name);
  if(matches.length!==1)throw new Error('Die Prüfsumme für den Installer fehlt oder ist uneindeutig.');
  return matches[0][1].toLowerCase();
}
