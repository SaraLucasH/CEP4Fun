[Setup]
AppName=CEP4Fun
AppVersion=1.0.1
DefaultDirName={autopf}\CEP4Fun
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
OutputBaseFilename=CEP4FunInstaller
Compression=lzma
SolidCompression=yes

[Dirs]
Name: "{app}\node-red"; Permissions: everyone-full
Name: "{app}\logs"; Permissions: everyone-full
Name: "{app}\data\mongodb"; Permissions: everyone-full

[Files]
Source: "..\smacly-web\*"; DestDir: "{app}\smacly-web"; Flags: recursesubdirs
Source: "..\node-red\*"; DestDir: "{app}\node-red"; Flags: recursesubdirs
Source: "..\siddhi-app\*"; DestDir: "{app}\siddhi-app"; Flags: recursesubdirs
Source: "..\compiler\*"; DestDir: "{app}\compiler"; Flags: recursesubdirs
Source: "..\runtime\*"; DestDir: "{app}\runtime"; Flags: recursesubdirs
Source: "Scripts\*"; DestDir: "{app}\installer\Scripts"; Flags: recursesubdirs

[Run]
Filename: {app}\installer\Scripts\install_services.bat; Flags: runhidden waituntilterminated; StatusMsg:Instalando servicios de CEP4Fun...

[UninstallRun]
Filename: {app}\installer\Scripts\remove_services.bat; Flags: runhidden waituntilterminated