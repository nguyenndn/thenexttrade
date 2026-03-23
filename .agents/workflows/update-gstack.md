---
description: Update gstack skills to latest version from GitHub
---

# /update-gstack — Cập nhật GStack lên bản mới nhất

// turbo-all

## Steps

1. Xóa folder gstack cũ
```powershell
Remove-Item -Recurse -Force "c:\laragon\www\gsn-crm\.agents\skills\gstack"
```

2. Clone bản mới nhất
```powershell
git clone https://github.com/garrytan/gstack.git "c:\laragon\www\gsn-crm\.agents\skills\gstack"
```

3. Xóa .git (để commit vào project repo)
```powershell
Remove-Item -Recurse -Force "c:\laragon\www\gsn-crm\.agents\skills\gstack\.git"
```

4. Kiểm tra version
```powershell
Get-Content "c:\laragon\www\gsn-crm\.agents\skills\gstack\VERSION"
```

5. Thông báo cho user version mới đã được cài.
