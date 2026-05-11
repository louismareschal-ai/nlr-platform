#!/bin/bash
# Forwards the NLR dev server (port 3010) to your Windows host so your phone can reach it.
# Run from WSL2: bash scripts/phone-access.sh
# Requires: dev server already running (npm run dev), phone on the same WiFi as this machine.

set -e

PORT=3010

# Find powershell.exe (not in PATH when called from WSL2 directly)
POWERSHELL=""
for candidate in \
  "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" \
  "/mnt/c/Windows/SysNative/WindowsPowerShell/v1.0/powershell.exe" \
  "/mnt/c/Program Files/PowerShell/7/pwsh.exe"; do
  if [ -f "$candidate" ]; then
    POWERSHELL="$candidate"
    break
  fi
done

if [ -z "$POWERSHELL" ]; then
  echo "Error: could not find powershell.exe. Make sure you're running in WSL2 with Windows interop enabled." >&2
  exit 1
fi

# WSL2's own IP
WSL_IP=$(ip addr show eth0 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1)
if [ -z "$WSL_IP" ]; then
  echo "Error: could not detect WSL2 IP." >&2; exit 1
fi

# Windows host LAN IP (what your phone connects to) — exclude WSL/Hyper-V virtual adapters
WINDOWS_IP=$("$POWERSHELL" -NoProfile -Command \
  "\$r = Get-NetIPAddress -AddressFamily IPv4 | \
   Where-Object { \$_.PrefixOrigin -in @('Dhcp','Manual') -and \$_.InterfaceAlias -notmatch 'WSL|Loopback|vEthernet|Bluetooth' } | \
   Sort-Object -Descending PrefixLength | \
   Select-Object -First 1; \
   if (\$r) { \$r.IPAddress }" \
  2>/dev/null | tr -d '\r\n ')

if [ -z "$WINDOWS_IP" ]; then
  echo "Warning: could not auto-detect Windows LAN IP."
  echo "Run 'ipconfig' in Windows CMD and look for your Wi-Fi adapter IPv4 address."
  echo "Then open http://<that-ip>:$PORT on your phone."
  echo ""
  # Still set up the proxy so it works once you know your IP
  WINDOWS_IP="<your-windows-ip>"
fi

# Write a temp PowerShell script (avoids quoting hell with netsh)
PS1_PATH="/mnt/c/Windows/Temp/nlr-phone.ps1"
cat > "$PS1_PATH" << PSEOF
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$PORT 2>\$null | Out-Null
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$PORT connectaddress=$WSL_IP connectport=$PORT
netsh advfirewall firewall delete rule name="NLR Dev $PORT" 2>\$null | Out-Null
netsh advfirewall firewall add rule name="NLR Dev $PORT" dir=in action=allow protocol=TCP localport=$PORT

Write-Host ""
Write-Host "  Port forwarding active." -ForegroundColor Green
Write-Host ""
Write-Host "  Open on your phone (same WiFi):" -ForegroundColor Cyan
Write-Host "  http://$WINDOWS_IP:$PORT" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to close..."
\$null = \$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
PSEOF

echo ""
echo "  WSL2 IP    : $WSL_IP"
echo "  Windows IP : $WINDOWS_IP"
echo "  Port       : $PORT"
echo ""
echo "  A UAC prompt will appear — click Yes to allow the firewall/proxy setup."
echo ""

"$POWERSHELL" -NoProfile -Command \
  "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File C:\\Windows\\Temp\\nlr-phone.ps1'"

echo "  Phone URL  : http://$WINDOWS_IP:$PORT"
echo ""
echo "  Make sure your phone is on the same WiFi network."
echo ""
