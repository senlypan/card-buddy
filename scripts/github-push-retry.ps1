# GitHub Push Retry Script (PowerShell)
# 自动重试推送直到成功

param(
    [string]$Remote = "origin",
    [string]$Branch = (git rev-parse --abbrev-ref HEAD),
    [int]$Interval = 60,
    [int]$MaxRetries = 10
)

Write-Host ""
Write-Host "🚀 GitHub 推送重试" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "远程仓库：${Remote}" -ForegroundColor White
Write-Host "目标分支：${Branch}" -ForegroundColor White
Write-Host "重试间隔：${Interval}秒" -ForegroundColor Yellow
Write-Host "最大重试：${MaxRetries}次" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$attempt = 1
$startTime = Get-Date

while ($attempt -le $MaxRetries) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "尝试 ${attempt}/${MaxRetries} - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # 执行推送
    $output = git push $Remote $Branch 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($output) {
        $output | ForEach-Object { Write-Host $_ }
    }
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ 推送成功！" -ForegroundColor Green
        $commitHash = git rev-parse --short HEAD
        $elapsedTime = (Get-Date) - $startTime
        Write-Host "📦 ${commitHash} → ${Remote}/${Branch}" -ForegroundColor Green
        Write-Host "⏱️  总耗时：$([int]$elapsedTime.TotalSeconds)秒" -ForegroundColor Yellow
        Write-Host ""
        exit 0
    } else {
        Write-Host ""
        Write-Host "❌ 推送失败（第 ${attempt} 次）" -ForegroundColor Red
        
        if ($attempt -lt $MaxRetries) {
            Write-Host "⏳ ${Interval}秒后重试..." -ForegroundColor Yellow
            Write-Host ""
            
            # 倒计时显示
            for ($i = $Interval; $i -gt 0; $i--) {
                Write-Host "`r  倒计时：$i 秒 " -NoNewline -ForegroundColor DarkGray
                Start-Sleep -Seconds 1
            }
            Write-Host "`r  " -NoNewline
        }
    }
    
    $attempt++
}

$elapsedTime = (Get-Date) - $startTime

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host "❌ 推送失败" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host ""
Write-Host "已达到最大重试次数 ${MaxRetries}" -ForegroundColor Yellow
Write-Host "总耗时：$([int]$elapsedTime.TotalSeconds)秒" -ForegroundColor Yellow
Write-Host ""
Write-Host "建议操作：" -ForegroundColor Cyan
Write-Host "1. 检查网络连接：ping github.com"
Write-Host "2. 检查 Git 配置：git remote -v"
Write-Host "3. 检查认证信息：git config --global credential.helper"
Write-Host "4. 手动重试：git push ${Remote} ${Branch}"
Write-Host ""

exit 1
