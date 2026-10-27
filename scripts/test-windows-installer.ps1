$ErrorActionPreference='Stop'
$taskVersion=(Get-Content -LiteralPath 'package.json' -Raw | ConvertFrom-Json).version
$taskPrevious=(Get-Content -LiteralPath 'desktop/test-baseline.json' -Raw | ConvertFrom-Json).previousVersion
$taskRoot=Join-Path $env:RUNNER_TEMP ('classjourney-install-'+[guid]::NewGuid().ToString('N'))
$taskInstall=Join-Path $taskRoot 'program'
$taskData=Join-Path $taskRoot 'data'
New-Item -ItemType Directory -Path $taskRoot -Force | Out-Null
function Invoke-InstallerTest([string]$taskSetup,[string]$taskMode,[string]$taskExpectedVersion){
  $taskProcess=Start-Process -FilePath (Resolve-Path -LiteralPath $taskSetup).Path -ArgumentList @('/S',"/D=$taskInstall") -WindowStyle Hidden -PassThru
  if(-not $taskProcess.WaitForExit(180000)){Stop-Process -Id $taskProcess.Id -Force;throw 'Installer test timed out.'}
  if($taskProcess.ExitCode -ne 0){throw "Installer failed: $($taskProcess.ExitCode)"}
  $taskExe=Join-Path $taskInstall 'ClassJourney.exe'
  if(-not(Test-Path -LiteralPath $taskExe)){throw 'Installed application missing.'}
  $taskStderr=Join-Path $taskRoot ('error-'+$taskMode+'.txt')
  $taskApp=Start-Process -FilePath $taskExe -ArgumentList @("--self-test=$taskMode","--test-data-dir=$taskData") -WindowStyle Hidden -RedirectStandardError $taskStderr -PassThru
  if(-not $taskApp.WaitForExit(90000)){Stop-Process -Id $taskApp.Id -Force;throw 'Installed app test timed out.'}
  if($taskApp.ExitCode -ne 0){Get-Content -LiteralPath $taskStderr;throw "Installed app test failed: $($taskApp.ExitCode)"}
  $taskReport=Get-Content -LiteralPath (Join-Path $taskData "self-test-$taskMode.json") -Raw | ConvertFrom-Json
  if($taskReport.version -ne $taskExpectedVersion){throw "Wrong installed version: $($taskReport.version)"}
  return $taskReport
}
$taskBefore=Invoke-InstallerTest "dist-native/$taskPrevious/ClassJourney-Setup-Windows-x64.exe" 'write' $taskPrevious
$taskAfter=Invoke-InstallerTest "dist-native/$taskVersion/ClassJourney-Setup-Windows-x64.exe" 'read' $taskVersion
$taskProtocol=(Get-ItemProperty -LiteralPath 'HKCU:\Software\Classes\classjourney\shell\open\command').'(default)'
if(-not $taskProtocol.Contains($taskInstall)){throw 'The browser-to-app protocol does not point to this installation.'}
if(-not $taskBefore.backupCreated -or -not $taskAfter.fixtureRetained){throw 'Plans or backup did not survive the update.'}
@{system='Windows x64';previousVersion=$taskBefore.version;installedVersion=$taskAfter.version;realInstallerUpgrade=$true;browserAppProtocolRegistered=$true;ownPlansImagesAndSettingsRetained=$true;backupCreated=$true} | ConvertTo-Json | Set-Content -LiteralPath 'dist-native/update-test-windows.json' -Encoding utf8
Write-Output 'Passed: real Windows installer upgrade retains the complete local collection and backup.'
