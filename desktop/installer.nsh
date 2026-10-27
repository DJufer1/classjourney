!macro customInstall
  WriteRegStr HKCU "Software\Classes\classjourney" "" "URL:ClassJourney"
  WriteRegStr HKCU "Software\Classes\classjourney" "URL Protocol" ""
  WriteRegStr HKCU "Software\Classes\classjourney\DefaultIcon" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
  WriteRegStr HKCU "Software\Classes\classjourney\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
!macroend

!macro customUnInstall
  ReadRegStr $0 HKCU "Software\Classes\classjourney\shell\open\command" ""
  StrCmp $0 '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"' 0 +2
    DeleteRegKey HKCU "Software\Classes\classjourney"
!macroend
