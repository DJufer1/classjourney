module.exports={
  appId:'ch.djufer.classjourney',productName:'ClassJourney',asar:true,
  protocols:[{name:'ClassJourney',schemes:['classjourney']}],
  files:['desktop/**','src/engine.mjs','src/updates.mjs','src/i18n.mjs','content/translations.json','docs/ClassJourney.html','assets/icon-512.png','package.json'],
  directories:{output:'dist-native'},publish:null,
  win:{target:[{target:'nsis',arch:['x64']}],icon:'assets/icon-512.png',artifactName:'ClassJourney-Setup-Windows-x64.exe'},
  nsis:{include:'desktop/installer.nsh',oneClick:false,perMachine:false,allowElevation:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,deleteAppDataOnUninstall:false,runAfterFinish:true,installerLanguages:['de_DE','en_US','fr_FR','es_ES','it_IT'],displayLanguageSelector:true},
  mac:{target:[{target:'dmg',arch:['universal']}],icon:'assets/icon-1024.png',category:'public.app-category.education',artifactName:'ClassJourney-Mac-universal.dmg',identity:'-',hardenedRuntime:true,entitlements:'desktop/entitlements.mac.plist',entitlementsInherit:'desktop/entitlements.mac.plist'},
  dmg:{title:'ClassJourney ${version}'}
};
