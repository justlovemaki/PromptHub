# PromptHub API 接口测试示例 (PowerShell + Token认证)
# 基础URL配置
$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api"

# 设置 UTF-8 编码以支持中文
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 加载System.Web程序集用于URL解码
try {
    Add-Type -AssemblyName System.Web
    Write-Host "System.Web程序集加载成功" -ForegroundColor Green
} catch {
    Write-Host "警告: 无法加载System.Web程序集，将使用替代方法进行URL解码" -ForegroundColor Yellow
}

Write-Host "=== PromptHub API 接口测试示例 (Token认证) ===" -ForegroundColor Green

# Token文件路径 - 用于存储登录后的JWT Token
$tokenFile = "$env:TEMP\prompt-manager-token.txt"

Write-Host "Token文件路径: $tokenFile" -ForegroundColor Yellow

# 检查是否安装了真正的curl命令（可选）
$curlExists = Get-Command curl.exe -ErrorAction SilentlyContinue
if ($curlExists) {
    Write-Host "找到curl.exe，但优先使用PowerShell原生方法" -ForegroundColor Green
} else {
    Write-Host "未找到curl.exe，使用PowerShell原生方法" -ForegroundColor Yellow
}

# 检查并处理PowerShell的curl别名（信息提示用）
try {
    if (Get-Alias curl -ErrorAction SilentlyContinue) {
        Write-Host "注意: PowerShell中存在curl别名，本脚本使用PowerShell原生方法" -ForegroundColor Yellow
    }
} catch {
    # 忽略错误
}

# ==================== 通用API调用函数 ====================
function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Url,
        [string]$Body = "",
        [hashtable]$Headers = @{},
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt",
        [string]$CookieFile = "$env:TEMP\prompt-manager-cookies.txt",
        [switch]$SaveToken,
        [switch]$UseToken,
        [switch]$UseCookies,
        [switch]$DisableAutoConvert
    )
    
    try {
        # 默认启用Cookie到Token的自动转换功能（除非明确禁用）
        $autoConvert = $true
        if ($DisableAutoConvert) {
            $autoConvert = $false
            Write-Host "自动Cookie转Token功能已禁用" -ForegroundColor Yellow
        }
        
        # 如果启用自动转换功能且UseToken为true
        if ($autoConvert -and $UseToken -and $CookieFile -ne "" -and $TokenFile -ne "") {
            Write-Host "检测到自动转换模式，尝试从Cookie提取Token..." -ForegroundColor Yellow
            
            if (Test-Path $CookieFile) {
                try {
                    $cookieContent = Get-Content $CookieFile -Raw
                    $extractedToken = Extract-TokenFromCookie -CookieString $cookieContent
                    
                    if ($extractedToken) {
                        $extractedToken | Out-File -FilePath $TokenFile -Encoding UTF8 -NoNewline
                        Write-Host "Cookie成功转换为Token，已保存到: $TokenFile" -ForegroundColor Green
                        $UseToken = $true
                        $UseCookies = $false
                    } else {
                        Write-Host "警告: 无法从Cookie中提取Token，将使用原有认证方式" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "警告: Cookie转换失败: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "提示: Cookie文件不存在，将直接使用Token认证" -ForegroundColor Cyan
            }
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        
        # 添加默认Headers
        $defaultHeaders = @{
            "User-Agent" = "PowerShell-API-Client/1.0"
            "Content-Type" = "application/json; charset=utf-8"
        }
        
        # 如果需要使用已保存的Token
        if ($UseToken -and $TokenFile -ne "" -and (Test-Path $TokenFile)) {
            try {
                $token = Get-Content $TokenFile -Raw -ErrorAction SilentlyContinue
                if ($token) {
                    $token = $token.Trim()
                    $defaultHeaders["Authorization"] = "Bearer $token"
                    Write-Host "使用保存的Token进行认证" -ForegroundColor Green
                }
            } catch {
                Write-Host "警告: 无法读取Token文件: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        } elseif ($UseCookies -and $CookieFile -ne "" -and (Test-Path $CookieFile)) {
            # 如果使用Cookie认证（作为备用方案）
            try {
                $cookieContent = Get-Content $CookieFile -Raw -ErrorAction SilentlyContinue
                if ($cookieContent) {
                    # 尝试从Cookie中提取token并使用
                    $extractedToken = Extract-TokenFromCookie -CookieString $cookieContent
                    if ($extractedToken) {
                        $defaultHeaders["Authorization"] = "Bearer $extractedToken"
                        Write-Host "从Cookie中提取Token进行认证" -ForegroundColor Green
                    } else {
                        Write-Host "警告: 无法从Cookie中提取有效Token" -ForegroundColor Yellow
                    }
                }
            } catch {
                Write-Host "警告: 无法读取Cookie文件: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
        
        # 合并自定义Headers
        if ($Headers.Count -gt 0) {
            foreach ($header in $Headers.GetEnumerator()) {
                $defaultHeaders[$header.Key] = $header.Value
            }
        }
        
        $params.Headers = $defaultHeaders
        
        if ($Body -ne "") {
            $params.Body = $Body
        }
        
        Write-Host "执行请求: $Method $Url" -ForegroundColor Cyan
        if ($Body -ne "") {
            Write-Host "请求体: $Body" -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest @params
        
        Write-Host "请求成功，状态码: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "响应内容: $($response.Content)" -ForegroundColor White
        
        # 调试信息 - 检查Token保存条件
        # Write-Host "调试信息 - Token保存条件检查:" -ForegroundColor Magenta
        # Write-Host "  SaveToken参数: $SaveToken" -ForegroundColor Gray
        # Write-Host "  TokenFile参数: '$TokenFile'" -ForegroundColor Gray
        # Write-Host "  TokenFile是否为空: $($TokenFile -eq '')" -ForegroundColor Gray
        # Write-Host "  响应内容是否存在: $([bool]$response.Content)" -ForegroundColor Gray
        # Write-Host "  响应内容长度: $($response.Content.Length)" -ForegroundColor Gray
        
        # 如果是登录请求且需要保存Token
        if ($SaveToken -and $TokenFile -ne "" -and $response.Content) {
            Write-Host "[DEBUG] 进入Token保存逻辑" -ForegroundColor Green
            try {
                $responseObj = $response.Content | ConvertFrom-Json
                $token = $null
                
                Write-Host "响应内容解析: $($response.Content)" -ForegroundColor Gray
                
                # 按优先级尝试不同的token字段名
                if ($responseObj.token) {
                    $token = $responseObj.token
                    Write-Host "从根级别token字段提取到: $token" -ForegroundColor Cyan
                } elseif ($responseObj.access_token) {
                    $token = $responseObj.access_token
                    Write-Host "从根级别access_token字段提取到: $token" -ForegroundColor Cyan
                } elseif ($responseObj.accessToken) {
                    $token = $responseObj.accessToken
                    Write-Host "从根级别accessToken字段提取到: $token" -ForegroundColor Cyan
                } elseif ($responseObj.data -and $responseObj.data.token) {
                    $token = $responseObj.data.token
                    Write-Host "从嵌套data.token字段提取到: $token" -ForegroundColor Cyan
                } elseif ($responseObj.data -and $responseObj.data.access_token) {
                    $token = $responseObj.data.access_token
                    Write-Host "从嵌套data.access_token字段提取到: $token" -ForegroundColor Cyan
                } elseif ($responseObj.auth -and $responseObj.auth.token) {
                    $token = $responseObj.auth.token
                    Write-Host "从嵌套auth.token字段提取到: $token" -ForegroundColor Cyan
                }
                
                if ($token) {
                    # 检查token是否包含.分隔符（session token格式）
                    if ($token.Contains('.')) {
                        # 使用通用函数截取token中.号之前的部分
                        $finalToken = Format-Token -Token $token
                        if ($finalToken) {
                            $finalToken | Out-File -FilePath $TokenFile -Encoding UTF8 -NoNewline
                            Write-Host "Session Token已保存到: $TokenFile" -ForegroundColor Green
                        } else {
                            Write-Host "警告: Session Token处理失败" -ForegroundColor Yellow
                        }
                    } else {
                        # 直接保存完整token（JWT或普通token格式）
                        $token | Out-File -FilePath $TokenFile -Encoding UTF8 -NoNewline
                        Write-Host "完整Token已保存到: $TokenFile" -ForegroundColor Green
                    }
                } else {
                    Write-Host "警告: 响应中未找到Token字段" -ForegroundColor Yellow
                    Write-Host "可用字段: $($responseObj | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "警告: 无法解析响应或保存Token: $($_.Exception.Message)" -ForegroundColor Yellow
                Write-Host "原始响应内容: $($response.Content)" -ForegroundColor Gray
            }
        } else {
            Write-Host "[DEBUG] 未进入Token保存逻辑，原因:" -ForegroundColor Yellow
            if (-not $SaveToken) { Write-Host "  - SaveToken参数为false" -ForegroundColor Gray }
            if ($TokenFile -eq "") { Write-Host "  - TokenFile参数为空" -ForegroundColor Gray }
            if (-not $response.Content) { Write-Host "  - 响应内容为空" -ForegroundColor Gray }
        }
        
        return $response
        
    } catch {
        $statusCode = "Unknown"
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $errorResponse = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorResponse)
                $errorContent = $reader.ReadToEnd()
                if ($errorContent) {
                    $errorMessage += ". 响应内容: $errorContent"
                }
            } catch {
                # 忽略读取错误响应的失败
            }
        }
        
        Write-Host "请求失败，状态码: $statusCode" -ForegroundColor Red
        Write-Host "错误信息: $errorMessage" -ForegroundColor Red
        
        # 根据状态码给出建议
        switch ($statusCode) {
            401 { Write-Host "建议: 请检查Token是否有效或重新登录获取新Token" -ForegroundColor Yellow }
            403 { Write-Host "建议: 请检查用户权限" -ForegroundColor Yellow }
            404 { Write-Host "建议: 请检查API路径是否正确" -ForegroundColor Yellow }
            500 { Write-Host "建议: 请检查服务器状态" -ForegroundColor Yellow }
        }
        
        throw
    }
}

# ==================== 认证相关 API ====================
Write-Host "`n1. 认证相关接口" -ForegroundColor Cyan

# POST /api/auth/sign-in/email - 用户登录 (保存token)
Write-Host "`nPOST /api/auth/sign-in/email - 用户登录并保存Token"
$loginData = @{
    email = "2741667957@qq.com"
    password = "12345678"
} | ConvertTo-Json -Depth 10

Invoke-Api -Method "POST" -Url "$apiUrl/auth/sign-in/email" -Body $loginData -SaveToken -TokenFile $tokenFile

Write-Host "登录成功后，Token已保存到: $tokenFile" -ForegroundColor Green

# ==================== 健康检查 API ====================
Write-Host "`n2. 健康检查接口" -ForegroundColor Cyan

# GET /api/health - 健康检查
Write-Host "GET /api/health - 健康检查"
Invoke-Api -Method "GET" -Url "$apiUrl/health" -UseToken -TokenFile $tokenFile

# ==================== 提示词管理 API ====================
Write-Host "`n3. 提示词管理接口 (使用Token认证)" -ForegroundColor Cyan

# GET /api/prompts/list - 获取提示词列表
Write-Host "`nGET /api/prompts/list - 获取提示词列表"
Invoke-Api -Method "GET" -Url "$apiUrl/prompts/list" -UseToken -TokenFile $tokenFile

# POST /api/prompts/create - 创建提示词
Write-Host "`nPOST /api/prompts/create - 创建提示词"
$createPromptData = @{
    title = "示例提示词"
    content = "这是一个示例提示词内容，用于测试API功能。"
    description = "这是提示词的描述，说明了这个提示词的用途。"
    tags = @("AI", "测试", "示例", "PowerShell")
    category = "测试分类"
    isPublic = $false
} | ConvertTo-Json -Depth 10

Invoke-Api -Method "POST" -Url "$apiUrl/prompts/create" -Body $createPromptData -UseToken -TokenFile $tokenFile

# POST /api/prompts/update - 更新提示词
Write-Host "`nPOST /api/prompts/update - 更新提示词"
$updatePromptData = @{
    id = "8536e2df-87b3-42aa-a66c-5a456a599645"  # 替换为实际的提示词ID
    data = @{
        title = "更新的提示词标题"
        content = "更新的提示词内容，包含更多详细信息。"
        description = "更新的描述，说明了修改的内容。"
        tags = @("AI", "更新", "示例", "修改")
        category = "更新分类"
        isPublic = $true
    }
} | ConvertTo-Json -Depth 10

Invoke-Api -Method "POST" -Url "$apiUrl/prompts/update" -Body $updatePromptData -UseToken -TokenFile $tokenFile

# POST /api/prompts/delete - 删除提示词
Write-Host "`nPOST /api/prompts/delete - 删除提示词"
$deletePromptData = @{
    id = "8536e2df-87b3-42aa-a66c-5a456a599645"  # 替换为实际的提示词ID
} | ConvertTo-Json -Depth 10

Invoke-Api -Method "POST" -Url "$apiUrl/prompts/delete" -Body $deletePromptData -UseToken -TokenFile $tokenFile

# ==================== 管理员 API ====================
Write-Host "`n4. 管理员接口 (需要管理员权限 + Token)" -ForegroundColor Cyan

# GET /api/admin/stats/get - 获取平台统计信息
Write-Host "`nGET /api/admin/stats/get - 获取平台统计信息"
Invoke-Api -Method "GET" -Url "$apiUrl/admin/stats/get" -UseToken -TokenFile $tokenFile

# GET /api/admin/users/list - 获取用户列表
Write-Host "`nGET /api/admin/users/list - 获取用户列表"
Invoke-Api -Method "GET" -Url "$apiUrl/admin/users/list" -UseToken -TokenFile $tokenFile

# POST /api/admin/users/update - 更新用户信息
Write-Host "`nPOST /api/admin/users/update - 更新用户信息"
$updateUserData = @{
    id = "j3lEedYhLvDqdi1K3HdTS5zDsv1XbxGj"  # 替换为实际的用户ID
    data = @{
        name = "新用户名"
        role = "USER"
        subscriptionStatus = "PRO"
        email = "updated@example.com"
    }
} | ConvertTo-Json -Depth 10

Invoke-Api -Method "POST" -Url "$apiUrl/admin/users/update" -Body $updateUserData -UseToken -TokenFile $tokenFile

# ==================== 服务器发送事件 API ====================
Write-Host "`n7. 服务器发送事件接口 (使用Token)" -ForegroundColor Cyan

# GET /api/sse - 服务器发送事件
Write-Host "`nGET /api/sse - 服务器发送事件"
Write-Host "注意: SSE 连接会持续接收事件，按 Ctrl+C 停止"
$sseHeaders = @{
    "Accept" = "text/event-stream"
    "Cache-Control" = "no-cache"
}
Invoke-Api -Method "GET" -Url "$apiUrl/sse" -Headers $sseHeaders -UseToken -TokenFile $tokenFile

# ==================== 便利函数定义 ====================
Write-Host "`n8. 便利函数示例" -ForegroundColor Cyan

# 登录并保存Token的函数
function Login-And-SaveToken {
    param(
        [string]$Email,
        [string]$Password,
        [string]$BaseUrl = "http://localhost:3000",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    $loginData = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    Write-Host "正在登录用户: $Email" -ForegroundColor Yellow
    
    try {
        Invoke-Api -Method "POST" -Url "$BaseUrl/api/auth/sign-in/email" -Body $loginData -SaveToken -TokenFile $TokenFile
        Write-Host "登录成功！Token已保存到: $TokenFile" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "登录失败！错误: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 使用Token执行API请求的函数（默认支持Cookie自动转换）
function Invoke-ApiWithToken {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [string]$Data = "",
        [string]$BaseUrl = "http://localhost:3000", 
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt",
        [string]$CookieFile = "$env:TEMP\prompt-manager-cookies.txt",
        [switch]$DisableAutoConvert
    )
    
    $url = "$BaseUrl/api/$Endpoint"
    
    if ($Data -eq "") {
        if ($DisableAutoConvert) {
            Invoke-Api -Method $Method -Url $url -UseToken -TokenFile $TokenFile -DisableAutoConvert
        } else {
            Invoke-Api -Method $Method -Url $url -UseToken -TokenFile $TokenFile -CookieFile $CookieFile
        }
    } else {
        if ($DisableAutoConvert) {
            Invoke-Api -Method $Method -Url $url -Body $Data -UseToken -TokenFile $TokenFile -DisableAutoConvert
        } else {
            Invoke-Api -Method $Method -Url $url -Body $Data -UseToken -TokenFile $TokenFile -CookieFile $CookieFile
        }
    }
}

# 简化的Cookie转Token API调用函数（现在默认已支持）
function Invoke-ApiWithCookieToToken {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [string]$Data = "",
        [string]$BaseUrl = "http://localhost:3000",
        [string]$CookieFile = "$env:TEMP\prompt-manager-cookies.txt",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    Write-Host "使用默认的Cookie自动转Token认证模式" -ForegroundColor Cyan
    
    # 直接使用Invoke-ApiWithToken，因为现在默认已支持自动转换
    Invoke-ApiWithToken -Method $Method -Endpoint $Endpoint -Data $Data -BaseUrl $BaseUrl -TokenFile $TokenFile -CookieFile $CookieFile
}

# 检查Token是否有效的函数
function Test-TokenValid {
    param(
        [string]$BaseUrl = "http://localhost:3000",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    if (!(Test-Path $TokenFile)) {
        Write-Host "Token文件不存在: $TokenFile" -ForegroundColor Red
        return $false
    }
    
    try {
        Invoke-Api -Method "GET" -Url "$BaseUrl/api/prompts/list" -UseToken -TokenFile $TokenFile
        Write-Host "Token有效！" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Token无效或已过期！错误: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# ==================== 批量测试函数 ====================
function Test-AllEndpointsWithToken {
    param(
        [string]$BaseUrl = "http://localhost:3000",
        [string]$Email = "test@example.com",
        [string]$Password = "123456",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    Write-Host "开始批量测试所有接口 (Token认证)..." -ForegroundColor Green
    
    # 1. 登录获取Token
    if (!(Login-And-SaveToken -Email $Email -Password $Password -BaseUrl $BaseUrl -TokenFile $TokenFile)) {
        Write-Host "登录失败，停止测试" -ForegroundColor Red
        return
    }
    
    # 2. 测试健康检查
    Write-Host "`n测试健康检查接口..."
    Invoke-ApiWithToken -Method "GET" -Endpoint "health" -BaseUrl $BaseUrl -TokenFile $TokenFile
    
    # 3. 测试提示词列表
    Write-Host "`n测试提示词列表接口..."
    Invoke-ApiWithToken -Method "GET" -Endpoint "prompts/list" -BaseUrl $BaseUrl -TokenFile $TokenFile
    
    # 4. 测试管理员统计（如果有权限）
    Write-Host "`n测试管理员统计接口..."
    Invoke-ApiWithToken -Method "GET" -Endpoint "admin/stats/get" -BaseUrl $BaseUrl -TokenFile $TokenFile
    
    Write-Host "`n批量测试完成!" -ForegroundColor Green
}

# ==================== 使用示例 ====================
Write-Host "`n9. 使用示例" -ForegroundColor Yellow
Write-Host "================================="
Write-Host "# 登录并保存Token:"
Write-Host 'Login-And-SaveToken -Email "user@example.com" -Password "password123"'
Write-Host ""
Write-Host "# 检查Token是否有效:"
Write-Host "Test-TokenValid"
Write-Host ""
Write-Host "# 使用Token调用API（默认自动从Cookie转换）:"
Write-Host 'Invoke-ApiWithToken -Method "GET" -Endpoint "prompts/list"'
Write-Host ""
Write-Host "# 禁用自动转换功能:"
Write-Host 'Invoke-ApiWithToken -Method "GET" -Endpoint "prompts/list" -DisableAutoConvert'
Write-Host ""
Write-Host "# 在Invoke-Api中直接使用（默认自动转换）:"
Write-Host 'Invoke-Api -Method "GET" -Url "http://localhost:3000/api/health" -UseToken'
Write-Host ""
Write-Host "# 禁用自动转换的Invoke-Api调用:"
Write-Host 'Invoke-Api -Method "GET" -Url "http://localhost:3000/api/health" -UseToken -DisableAutoConvert'
Write-Host ""
Write-Host "# 批量测试所有接口:"
Write-Host 'Test-AllEndpointsWithToken -Email "user@example.com" -Password "password123"'
Write-Host ""
Write-Host "# Token提取示例（自动支持多种响应格式）:"
Write-Host '# 支持响应格式示例:'
Write-Host '# 1. {"token":"xxx"} - 直接根级token字段'
Write-Host '# 2. {"access_token":"xxx"} - OAuth2标准格式'
Write-Host '# 3. {"data":{"token":"xxx"}} - 嵌套数据格式'
Write-Host '# 4. {"auth":{"token":"xxx"}} - 认证对象格式'
Write-Host "# 系统会自动检测并提取正确的token字段"
Write-Host "# 支持Session Token格式（自动截取.号之前部分）"
Write-Host "# 支持JWT格式（保持完整token）"
Write-Host "================================="

# ==================== Token管理函数 ====================
Write-Host "`n10. Token管理函数" -ForegroundColor Cyan

# 清除Token的函数
function Clear-LoginToken {
    param(
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    if (Test-Path $TokenFile) {
        Remove-Item $TokenFile -Force
        Write-Host "Token文件已删除: $TokenFile" -ForegroundColor Green
    } else {
        Write-Host "Token文件不存在: $TokenFile" -ForegroundColor Yellow
    }
}

# 显示Token内容的函数
function Show-TokenContent {
    param(
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    if (Test-Path $TokenFile) {
        Write-Host "Token文件内容:" -ForegroundColor Yellow
        $token = Get-Content $TokenFile -Raw
        Write-Host $token
        
        # 尝试解析JWT Token信息（如果是JWT格式）
        try {
            $tokenParts = $token.Split('.')
            if ($tokenParts.Length -eq 3) {
                # 解析JWT Header和Payload
                $header = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[0] + "=="))
                $payload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "=="))
                
                Write-Host "`nJWT Header:" -ForegroundColor Cyan
                $header | ConvertFrom-Json | ConvertTo-Json -Depth 10
                
                Write-Host "`nJWT Payload:" -ForegroundColor Cyan
                $payloadObj = $payload | ConvertFrom-Json
                $payloadObj | ConvertTo-Json -Depth 10
                
                # 检查过期时间
                if ($payloadObj.exp) {
                    $expiry = [DateTimeOffset]::FromUnixTimeSeconds($payloadObj.exp).DateTime
                    Write-Host "`nToken过期时间: $expiry" -ForegroundColor Yellow
                    if ($expiry -lt (Get-Date)) {
                        Write-Host "警告: Token已过期！" -ForegroundColor Red
                    } else {
                        Write-Host "Token仍然有效" -ForegroundColor Green
                    }
                }
            }
        } catch {
            Write-Host "注意: 无法解析JWT格式，可能是普通Token" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Token文件不存在: $TokenFile" -ForegroundColor Red
    }
}

# ==================== 错误处理示例 ====================
Write-Host "`n11. 错误处理示例" -ForegroundColor Magenta

# 带错误处理的API调用函数
function Invoke-ApiWithErrorHandling {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [string]$Data = "",
        [string]$BaseUrl = "http://localhost:3000",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    # 检查Token文件是否存在
    if (!(Test-Path $TokenFile)) {
        Write-Host "错误: Token文件不存在，请先登录" -ForegroundColor Red
        return $false
    }
    
    $url = "$BaseUrl/api/$Endpoint"
    
    try {
        if ($Data -eq "") {
            Invoke-Api -Method $Method -Url $url -UseToken -TokenFile $TokenFile
        } else {
            Invoke-Api -Method $Method -Url $url -Body $Data -UseToken -TokenFile $TokenFile
        }
        
        Write-Host "请求成功" -ForegroundColor Green
        return $true
        
    } catch {
        $errorMessage = $_.Exception.Message
        
        # 检查是否是认证错误
        if ($errorMessage -like "*401*" -or $errorMessage -like "*Unauthorized*") {
            Write-Host "认证失败，尝试重新登录..." -ForegroundColor Yellow
            
            # 尝试自动重新登录（需要提供邮箱和密码）
            Write-Host "请手动调用登录函数重新获取Token" -ForegroundColor Yellow
        }
        
        Write-Host "请求失败: $errorMessage" -ForegroundColor Red
        return $false
    }
}

# ==================== Cookie中Token提取 ====================
Write-Host "`n12. Cookie中Token提取" -ForegroundColor Blue

# 从Cookie字符串中提取session token的函数
function Extract-TokenFromCookie {
    param(
        [string]$CookieString
    )
    
    try {
        # 查找 better-auth.session_token 的值
        $pattern = "better-auth\.session_token=([^;]+)"
        $match = [regex]::Match($CookieString, $pattern)
        
        if ($match.Success) {
            $fullToken = $match.Groups[1].Value
            Write-Host "找到完整token: $fullToken" -ForegroundColor Green
            
            # URL解码 - 尝试多种方法
            $decodedToken = $fullToken
            try {
                # 首先尝试使用System.Web.HttpUtility
                $decodedToken = [System.Web.HttpUtility]::UrlDecode($fullToken)
            } catch {
                # 如果失败，使用PowerShell内置方法
                $decodedToken = $fullToken -replace '%2B', '+' -replace '%2F', '/' -replace '%3D', '='
                Write-Host "使用替代URL解码方法" -ForegroundColor Yellow
            }
            
            Write-Host "URL解码后: $decodedToken" -ForegroundColor Cyan
            
            # 截取.号之前的部分
            $dotIndex = $decodedToken.IndexOf('.')
            if ($dotIndex -gt 0) {
                $sessionToken = $decodedToken.Substring(0, $dotIndex)
                Write-Host "提取的session token: $sessionToken" -ForegroundColor Yellow
                return $sessionToken
            } else {
                Write-Host "警告: token中未找到.分隔符" -ForegroundColor Yellow
                return $decodedToken
            }
        } else {
            Write-Host "错误: 未找到 better-auth.session_token" -ForegroundColor Red
            return $null
        }
    } catch {
        Write-Host "错误: 无法解析Cookie字符串: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 从Cookie文件中提取并保存session token的函数
function Extract-SessionTokenFromCookieFile {
    param(
        [string]$CookieFile = "$env:TEMP\prompt-manager-cookies.txt",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    if (!(Test-Path $CookieFile)) {
        Write-Host "错误: Cookie文件不存在: $CookieFile" -ForegroundColor Red
        return $false
    }
    
    try {
        $cookieContent = Get-Content $CookieFile -Raw
        $sessionToken = Extract-TokenFromCookie -CookieString $cookieContent
        
        if ($sessionToken) {
            $sessionToken | Out-File -FilePath $TokenFile -Encoding UTF8 -NoNewline
            Write-Host "Session token已保存到: $TokenFile" -ForegroundColor Green
            return $true
        } else {
            Write-Host "错误: 无法从Cookie中提取session token" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "错误: 处理Cookie文件时出错: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Cookie示例测试函数
function Test-CookieTokenExtraction {
    # 测试用的Cookie字符串
    $testCookie = "better-auth.session_token=nOfAHFDJSOcAPqbTv93Yplu0KP2zh8EZ.8uNePBtNEa%2BfI7gHS1Vb%2B0BFUVt8F6PUJTvNxMp6%2Bz0%3D; Path=/; Domain=localhost"
    
    Write-Host "测试Cookie字符串:" -ForegroundColor Yellow
    Write-Host $testCookie -ForegroundColor Gray
    
    Write-Host "`n提取结果:" -ForegroundColor Yellow
    $token = Extract-TokenFromCookie -CookieString $testCookie
    
    if ($token) {
        Write-Host "成功提取session token: $token" -ForegroundColor Green
    } else {
        Write-Host "提取失败" -ForegroundColor Red
    }
}

# Token响应提取测试函数
function Test-TokenResponseExtraction {
    # 测试不同的响应格式
    $testResponses = @(
        @{
            Name = "直接根级token字段"
            Response = '{"redirect":false,"token":"Qqwsoxl7LpAfV5m3DfBZTaKaAD9RFADf","user":{"id":"eLyiiZGLdCpAo5lYDukfTKuHP8SwHz2M","email":"2741667957@qq.com"}}'
        },
        @{
            Name = "OAuth2标准格式"
            Response = '{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U","token_type":"Bearer","expires_in":3600}'
        },
        @{
            Name = "嵌套数据格式"
            Response = '{"status":"success","data":{"token":"session_abc123.xyz789","user":{"id":"user123"}}}'
        },
        @{
            Name = "认证对象格式"
            Response = '{"auth":{"token":"auth_token_456","refresh_token":"refresh_789"},"profile":{"name":"John"}}'
        }
    )
    
    foreach ($test in $testResponses) {
        Write-Host "`n测试: $($test.Name)" -ForegroundColor Yellow
        Write-Host "响应内容: $($test.Response)" -ForegroundColor Gray
        
        $extractedToken = Extract-TokenFromResponse -ResponseContent $test.Response
        
        if ($extractedToken) {
            Write-Host "成功提取token: $extractedToken" -ForegroundColor Green
        } else {
            Write-Host "提取失败" -ForegroundColor Red
        }
    }
}

# 执行测试
Write-Host "`n执行Cookie token提取测试:" -ForegroundColor Cyan
Test-CookieTokenExtraction

Write-Host "`n执行响应Token提取测试:" -ForegroundColor Cyan
Test-TokenResponseExtraction

# Cookie转Token认证的便利函数
function Convert-CookieToTokenAuth {
    param(
        [string]$CookieFile = "$env:TEMP\prompt-manager-cookies.txt",
        [string]$TokenFile = "$env:TEMP\prompt-manager-token.txt"
    )
    
    Write-Host "开始从Cookie认证转换为Token认证..." -ForegroundColor Yellow
    
    if (Extract-SessionTokenFromCookieFile -CookieFile $CookieFile -TokenFile $TokenFile) {
        Write-Host "转换成功！现在可以使用Token认证方式" -ForegroundColor Green
        
        # 测试Token是否有效
        Write-Host "`n测试Token有效性..." -ForegroundColor Cyan
        if (Test-TokenValid -TokenFile $TokenFile) {
            Write-Host "Token认证转换完成！" -ForegroundColor Green
            return $true
        } else {
            Write-Host "警告: 提取的Token可能无效" -ForegroundColor Yellow
            return $false
        }
    } else {
        Write-Host "转换失败" -ForegroundColor Red
        return $false
    }
}

# 使用示例
Write-Host "`n15. Cookie转Token认证使用示例" -ForegroundColor Yellow
Write-Host "================================="
Write-Host "# 默认情况下，使用Token认证时会自动从Cookie转换:"
Write-Host 'Invoke-ApiWithToken -Method "GET" -Endpoint "prompts/list"'
Write-Host ""
Write-Host "# 手动从Cookie文件中提取session token:"
Write-Host 'Extract-SessionTokenFromCookieFile'
Write-Host ""
Write-Host "# 一次性转换Cookie认证为Token认证:"
Write-Host 'Convert-CookieToTokenAuth'
Write-Host ""
Write-Host "# 直接从Cookie字符串提取token:"
Write-Host '$token = Extract-TokenFromCookie -CookieString "better-auth.session_token=xxx"'
Write-Host ""
Write-Host "# 在Invoke-Api中默认启用自动转换:"
Write-Host 'Invoke-Api -Method "GET" -Url "http://localhost:3000/api/health" -UseToken'
Write-Host ""
Write-Host "# 禁用自动转换功能:"
Write-Host 'Invoke-Api -Method "POST" -Url "http://localhost:3000/api/prompts/create" \'
Write-Host '    -Body $jsonData -UseToken -DisableAutoConvert'
Write-Host ""
Write-Host "# 使用简化的Cookie转Token函数:"
Write-Host 'Invoke-ApiWithCookieToToken -Method "GET" -Endpoint "health"'
Write-Host "=================================="

# ==================== 高级Token操作 ====================
Write-Host "`n13. 高级Token操作" -ForegroundColor Blue

# 从响应中提取Token的函数（适用于不同的API返回格式）
function Extract-TokenFromResponse {
    param(
        [string]$ResponseContent
    )
    
    try {
        $responseObj = $ResponseContent | ConvertFrom-Json
        
        Write-Host "解析响应内容: $ResponseContent" -ForegroundColor Gray
        
        # 按优先级尝试不同的Token字段名
        $tokenFields = @(
            @{Path="token"; Description="根级别token字段"},
            @{Path="access_token"; Description="根级别access_token字段"},
            @{Path="accessToken"; Description="根级别accessToken字段"},
            @{Path="jwt"; Description="根级别jwt字段"},
            @{Path="authToken"; Description="根级别authToken字段"},
            @{Path="data.token"; Description="嵌套data.token字段"},
            @{Path="data.access_token"; Description="嵌套data.access_token字段"},
            @{Path="data.accessToken"; Description="嵌套data.accessToken字段"},
            @{Path="auth.token"; Description="嵌套auth.token字段"},
            @{Path="auth.access_token"; Description="嵌套auth.access_token字段"},
            @{Path="result.token"; Description="嵌套result.token字段"}
        )
        
        foreach ($field in $tokenFields) {
            $fieldPath = $field.Path
            $fieldDesc = $field.Description
            
            # 处理嵌套字段
            if ($fieldPath.Contains('.')) {
                $parts = $fieldPath.Split('.')
                $value = $responseObj
                
                $isValid = $true
                foreach ($part in $parts) {
                    if ($value -and $value.$part) {
                        $value = $value.$part
                    } else {
                        $isValid = $false
                        break
                    }
                }
                
                if ($isValid -and $value) {
                    Write-Host "从${fieldDesc}提取到: $value" -ForegroundColor Cyan
                    return $value
                }
            } else {
                # 处理根级字段
                if ($responseObj.$fieldPath) {
                    Write-Host "从${fieldDesc}提取到: $($responseObj.$fieldPath)" -ForegroundColor Cyan
                    return $responseObj.$fieldPath
                }
            }
        }
        
        Write-Host "警告: 在响应中未找到Token字段" -ForegroundColor Yellow
        Write-Host "可用字段: $($responseObj | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)" -ForegroundColor Gray
        return $null
        
    } catch {
        Write-Host "错误: 无法解析响应内容: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "原始响应内容: $ResponseContent" -ForegroundColor Gray
        return $null
    }
}

# 验证Token格式的函数
function Test-TokenFormat {
    param(
        [string]$Token
    )
    
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Host "Token为空" -ForegroundColor Red
        return $false
    }
    
    # 检查是否是JWT格式
    $parts = $Token.Split('.')
    if ($parts.Length -eq 3) {
        Write-Host "检测到JWT格式Token" -ForegroundColor Green
        return $true
    }
    
    # 检查是否是简单的字符串Token
    if ($Token.Length -gt 10) {
        Write-Host "检测到普通字符串Token" -ForegroundColor Green
        return $true
    }
    
    Write-Host "Token格式可能不正确" -ForegroundColor Yellow
    return $false
}

# ==================== 配置说明 ====================
Write-Host "`n14. 重要配置说明" -ForegroundColor Red
Write-Host "================================="
Write-Host "1. Token认证方式说明:"
Write-Host "   - 首次使用需要先调用登录接口获取Token"
Write-Host "   - Token会自动保存到临时文件中"
Write-Host "   - 后续请求会在Authorization头中包含'Bearer {token}'"
Write-Host ""
Write-Host "2. Token文件位置:"
Write-Host "   - 默认位置: $env:TEMP\prompt-manager-token.txt"
Write-Host "   - 可以通过参数自定义位置"
Write-Host ""
Write-Host "3. 安全注意事项:"
Write-Host "   - Token包含敏感信息，请妥善保管"
Write-Host "   - 不要在生产环境中使用明文密码"
Write-Host "   - 定期检查Token是否过期"
Write-Host "   - Token通常有过期时间，过期后需要重新登录"
Write-Host ""
Write-Host "4. 常见问题解决:"
Write-Host "   - 401错误: Token无效或过期，重新登录获取新Token"
Write-Host "   - 403错误: 检查用户权限"
Write-Host "   - 500错误: 检查服务器状态"
Write-Host ""
Write-Host "5. Token格式支持:"
Write-Host "   - JWT Token（推荐）: 包含过期信息"
Write-Host "   - 普通字符串Token: 简单格式"
Write-Host "   - Session Token: 从Cookie中提取的会话Token（自动截取.号之前）"
Write-Host "   - 自动检测Token格式并提供相应信息"
Write-Host "   - 支持多种响应格式：{token}, {access_token}, {data:{token}}, {auth:{token}}"
Write-Host ""
Write-Host "5.1 Token提取增强功能:"
Write-Host "   - 智能识别多种响应格式：根级、嵌套data、嵌套auth等"
Write-Host "   - 详细日志输出：显示响应内容和提取过程"
Write-Host "   - 错误处理：提供详细的错误信息和可用字段列表"
Write-Host "   - 格式智能判断：Session Token自动截取，JWT Token保持完整"
Write-Host "   - 支持响应格式示例：{\"token\":\"xxx\"}, {\"data\":{\"token\":\"xxx\"}}"
Write-Host ""
Write-Host "6. Cookie到Token转换（默认启用）:"
Write-Host "   - 默认自动从better-auth.session_token Cookie中提取Token"
Write-Host "   - 自动URL解码并截取.号之前的部分作为Session Token"
Write-Host "   - 提供Cookie文件到Token文件的转换功能"
Write-Host "   - 兼容多种URL编码格式"
Write-Host "   - 可使用-DisableAutoConvert参数禁用自动转换"
Write-Host ""
Write-Host "7. 服务器配置:"
Write-Host "   - 确保服务器在 localhost:3000 运行"
Write-Host "   - 确保服务器支持Bearer Token认证"
Write-Host "   - 检查CORS设置是否正确"
Write-Host "   - 确认Authorization头的处理逻辑"
Write-Host "================================="

Write-Host "`nToken认证API示例脚本使用完毕!" -ForegroundColor Green
Write-Host "使用方法: 先运行登录函数获取Token，然后使用其他API函数" -ForegroundColor Yellow


