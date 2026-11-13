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
Name: "{app}\n8n"; Permissions: everyone-full
Name: "{app}\logs"; Permissions: everyone-full
Name: "{app}\data\mongodb"; Permissions: everyone-full
Name: "{app}\data\kafka"; Permissions: everyone-full
Name: "{app}\data\flink"; Permissions: everyone-full

[Files]
Source: "..\smacly-web\*"; DestDir: "{app}\smacly-web"; Flags: recursesubdirs
Source: "..\n8n\*"; DestDir: "{app}\n8n"; Flags: recursesubdirs
Source: "..\siddhi-app\*"; DestDir: "{app}\siddhi-app"; Flags: recursesubdirs
Source: "..\compiler\*"; DestDir: "{app}\compiler"; Flags: recursesubdirs
; Jar ya compilado (mvn clean package en flink-app/), igual que compiler\compilador.jar:
; no se empaqueta el proyecto Maven entero, solo el artefacto final.
Source: "..\flink-app\target\flink-app-1.0.0.jar"; DestDir: "{app}\flink-app"; DestName: "flink-app-1.0.0.jar"
; node_modules\n8n excluido: too many files inside directory. MaxPath has been reached
; See installer\Scripts\pack-n8n-runtime.bat
Source: "..\runtime\*"; DestDir: "{app}\runtime"; Flags: recursesubdirs; Excludes: "node\node_modules\n8n\*"
Source: "Scripts\*"; DestDir: "{app}\installer\Scripts"; Flags: recursesubdirs

[Run]
Filename: {app}\installer\Scripts\install_services.bat; Flags: runhidden waituntilterminated; StatusMsg:Instalando servicios de CEP4Fun...

[UninstallRun]
Filename: {app}\installer\Scripts\remove_services.bat; Flags: runhidden waituntilterminated