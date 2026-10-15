#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'

$ruleName = 'SynthViewTopy-LAN'
$ruleSettings = @{
    DisplayName = 'SynthViewTopy LAN'
    Direction = 'Inbound'
    Action = 'Allow'
    Enabled = 'True'
    Protocol = 'TCP'
    LocalPort = @(5178, 5179)
    Program = (Get-Command node.exe -ErrorAction Stop).Source
    RemoteAddress = 'LocalSubnet'
    Profile = 'Private'
}

if (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue) {
    Set-NetFirewallRule -Name $ruleName @ruleSettings
} else {
    New-NetFirewallRule -Name $ruleName @ruleSettings | Out-Null
}

Write-Host 'SynthViewTopy can receive local-subnet connections on ports 5178 and 5179 on Private networks.'
