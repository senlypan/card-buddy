# 📦 card-buddy Git 工作流指南

## 分支结构

```
main
├── prd          # 生产分支 - 稳定可发布版本 ✅
├── test         # 测试分支 - 已验证功能 🧪
└── feature/*    # 功能分支 - 开发中功能 🚧
```

## 快速开始

### 1. 初始化分支结构（首次使用）

```bash
cd card-buddy

# 确保在 master/main 分支
git checkout master

# 创建 prd 分支（从当前代码）
git branch prd

# 创建 test 分支
git branch test

# 推送所有分支到 GitHub
git push origin prd test master
```

### 2. 开发新功能

```bash
# 使用技能脚本创建功能分支
scripts/git-feature.sh new-feature

# 或者直接创建
git checkout prd
git pull origin prd
git checkout -b feature/new-feature
```

### 3. 提交代码

```bash
# 开发过程中频繁提交
git add .
git commit -m "feat: 实现 XXX 功能"
```

### 4. 提交到 test 分支验证

```bash
# 使用技能脚本
scripts/git-to-test.sh

# 或者手动操作
git checkout test
git pull origin test
git merge feature/new-feature
git push origin test
```

### 5. 验证后合并到 prd

```bash
# 使用技能脚本
scripts/git-to-prd.sh

# 或者手动操作
git checkout prd
git pull origin prd
git merge test
git push origin prd
```

### 6. 推送失败时使用重试脚本

```bash
# 如果网络不稳定，使用重试脚本
scripts/github-push-retry.sh

# PowerShell 版本（Windows）
.\scripts\github-push-retry.ps1
```

## 提交信息规范

使用约定式提交（Conventional Commits）：

| 类型 | 说明 | 示例 |
|-----|------|------|
| `feat` | 新功能 | `feat: 添加炸金花游戏` |
| `fix` | 修复 bug | `fix: 修复积分计算错误` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 重构 | `refactor: 优化卡片算法` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具 | `chore: 更新依赖` |

### 提交信息模板

```
<type>: <简短描述>

<可选：详细描述>
```

示例：
```
feat: 完成儿童简化版炸金花游戏

- 简化游戏规则，适合 6-10 岁儿童
- 添加牌型 emoji 提示
- 优化 UI 样式

🃏 祝小朋友玩得开心！
```

## 脚本使用说明

### git-feature.sh

创建新的功能分支。

```bash
# 用法
scripts/git-feature.sh <功能名>

# 示例
scripts/git-feature.sh zhajinhua-game
scripts/git-feature.sh user-profile
```

### git-to-test.sh

将当前功能分支合并到 test 分支。

```bash
# 在功能分支上运行
git checkout feature/xxx
scripts/git-to-test.sh
```

### git-to-prd.sh

将 test 分支合并到 prd 分支。

```bash
# 在 test 或 prd 分支上运行
git checkout test
scripts/git-to-prd.sh
```

### github-push-retry.ps1

自动重试推送直到成功（Windows PowerShell）。

```bash
# 基本用法
.\scripts\github-push-retry.ps1

# 指定参数
.\scripts\github-push-retry.ps1 -Remote origin -Branch prd -Interval 30 -MaxRetries 5
```

### github-push-retry.sh

自动重试推送直到成功（Linux/macOS Bash）。

```bash
# 基本用法
./scripts/github-push-retry.sh

# 指定参数
./scripts/github-push-retry.sh origin prd 30 5
```

## 完整工作流示例

### 示例：开发炸金花功能

```bash
# 1. 创建功能分支
cd card-buddy
scripts/git-feature.sh zhajinhua-game

# 2. 开发功能
# ... 编写代码 ...

# 3. 提交代码
git add .
git commit -m "feat: 实现炸金花基础功能"

# 4. 继续开发
# ... 更多代码 ...
git add .
git commit -m "feat: 添加积分系统"

# 5. 提交到 test 分支验证
scripts/git-to-test.sh

# 6. 在 test 分支上测试
git checkout test
# ... 运行测试 ...

# 7. 验证通过后合并到 prd
scripts/git-to-prd.sh

# 8. 清理功能分支
git branch -d feature/zhajinhua-game
git push origin --delete feature/zhajinhua-game
```

### 示例：紧急修复 bug

```bash
# 1. 创建紧急修复分支
git checkout prd
git checkout -b hotfix/crash-fix

# 2. 修复 bug
# ... 修复代码 ...
git add .
git commit -m "fix: 修复崩溃问题"

# 3. 快速验证
scripts/git-to-test.sh

# 4. 立即合并到 prd
scripts/git-to-prd.sh

# 5. 清理
git branch -d hotfix/crash-fix
```

## 分支管理技巧

### 查看分支状态

```bash
# 查看所有分支
git branch -a

# 查看已合并到 prd 的分支
git branch --merged prd

# 查看未合并的分支
git branch --no-merged prd
```

### 清理旧分支

```bash
# 删除本地已完成的 feature 分支
git branch --merged prd | grep "feature/" | xargs git branch -d

# 删除远程已完成的 feature 分支
git fetch -p && for branch in $(git branch -r --merged prd | grep "feature/"); do
    git push origin --delete $branch
done
```

### 查看提交历史

```bash
# 查看 prd 分支提交历史
git log prd --oneline --graph

# 查看两个分支的差异
git log prd..test --oneline
```

## 故障排查

### 问题：推送失败

```bash
# 1. 检查网络连接
ping github.com

# 2. 检查远程仓库配置
git remote -v

# 3. 使用重试脚本
scripts/github-push-retry.ps1

# 4. 手动重试
git push origin prd
```

### 问题：合并冲突

```bash
# 1. 切换到冲突分支
git checkout test

# 2. 合并 prd 分支解决冲突
git merge prd

# 3. 解决冲突后提交
git add .
git commit -m "merge: 解决合并冲突"

# 4. 继续推送
git push origin test
```

### 问题：误操作分支

```bash
# 撤销最后一次合并
git merge --abort

# 恢复到之前的提交
git reflog
git reset --hard HEAD@{1}

# 强制推送（谨慎使用）
git push origin prd --force
```

## 最佳实践

1. ✅ **每个功能一个分支** - 不要在一个分支上开发多个功能
2. ✅ **小步提交** - 频繁提交，每次提交描述清晰
3. ✅ **及时清理** - 功能完成后删除 feature 分支
4. ✅ **验证后再合并** - test 分支验证通过再合并到 prd
5. ✅ **使用重试脚本** - 网络不稳定时自动重试

---

**记住：** 好的分支管理让你远离生产事故！🔧
