# start_tunnels.ps1
# This script starts your backend and vision engine tunnels using a local config and gives you the Vercel config.

Write-Host "Starting Urban Pulse AI Tunnels (Multi-Tunnel Mode)..." -ForegroundColor Cyan

# 1. Kill any existing ngrok instances
Stop-Process -Name ngrok -ErrorAction SilentlyContinue

# 2. Set the ngrok path
$ngrokPath = "C:\Users\kushw\AppData\Roaming\npm\ngrok.cmd"
$configPath = "$PSScriptRoot\ngrok.yml"

if (!(Test-Path $ngrokPath)) {
    Write-Host "Error: $ngrokPath not found." -ForegroundColor Red
    exit
}

# 3. Start tunnels from the config file
Write-Host "Launching tunnels: [backend:4007], [vision:5001]..."
Start-Process -FilePath $ngrokPath -ArgumentList "start --all --config `"$configPath`"" -WindowStyle Hidden
Start-Sleep -Seconds 5

# 4. Wait for ngrok to initialize and fetch URLs
Write-Host "Waiting for public URLs from ngrok API..."
$maxRetries = 15
$urls = @()

for ($i=0; $i -lt $maxRetries; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction Stop
        $urls = $response.tunnels
        if ($urls.Count -ge 2) { break }
        Write-Host "Received $($urls.Count) tunnels so far..."
    } catch {
        Write-Host "API not ready yet, retrying..."
    }
    Start-Sleep -Seconds 2
}

if ($urls.Count -lt 2) {
    Write-Host "Error: Could not establish both tunnels. Check if ngrok is properly authenticated in scripts/ngrok.yml." -ForegroundColor Red
    exit
}

# 5. Identify which URL is which
$backendUrl = ""
$cameraUrl = ""

foreach ($t in $urls) {
    if ($t.name -eq "backend") { $backendUrl = $t.public_url }
    if ($t.name -eq "vision") { $cameraUrl = $t.public_url }
}

Write-Host "`n✅ TUNNELS ACTIVE" -ForegroundColor Green
Write-Host "--------------------------------------------------"
Write-Host "Backend URL: $backendUrl"
Write-Host "Camera URL:  $cameraUrl"
Write-Host "--------------------------------------------------`n"

Write-Host "📋 COPY THESE TO VERCEL SETTINGS:" -ForegroundColor Yellow
Write-Host "VITE_API_URL=$backendUrl"
Write-Host "VITE_SOCKET_URL=$backendUrl"
Write-Host "VITE_CAMERA_URL=$cameraUrl/video_feed"
Write-Host "--------------------------------------------------"
Write-Host "💡 Don't forget to Redeploy in Vercel after saving!"
