# 修仙游戏测试脚本

本目录包含了一系列用于测试修仙游戏核心功能的脚本。这些测试脚本可以帮助验证游戏各个部分的功能是否正常工作。

## 测试脚本列表

| 脚本名称 | 描述 | 运行命令 |
|----------|------|----------|
| start_game.ts | 测试游戏开始功能 | `npx tsx script/start_game.ts` |
| test_push_game.ts | 测试游戏推进功能 | `npx tsx script/test_push_game.ts` |
| test_context_compression.ts | 测试上下文压缩功能 | `npx tsx script/test_context_compression.ts` |
| test_game_end.ts | 测试游戏结束条件 | `npx tsx script/test_game_end.ts` |
| test_error_handling.ts | 测试错误处理 | `npx tsx script/test_error_handling.ts` |
| test_transaction.ts | 测试数据库事务 | `npx tsx script/test_transaction.ts` |
| test_character_status_update.ts | 测试角色状态更新 | `npx tsx script/test_character_status_update.ts` |

## 如何运行测试

1. 确保已安装所有依赖：
   ```bash
   pnpm install
   ```

2. 运行特定测试脚本：
   ```bash
   npx tsx script/脚本名称.ts
   ```

3. 查看输出结果来验证功能是否正常

## 测试脚本详细说明

### start_game.ts
测试游戏开始功能，创建一个新游戏并生成第一个游戏节点。测量游戏创建所需的时间。

### test_push_game.ts
测试游戏推进功能，在现有游戏中添加新的游戏节点。需要提供有效的游戏ID、角色ID和选项。

### test_context_compression.ts
测试上下文压缩功能，通过多次推进游戏来触发上下文压缩机制，验证当游戏节点超过3个时是否正确压缩为摘要。

### test_game_end.ts
测试游戏结束条件，包括角色死亡和任务完成两种情况，验证系统是否正确处理游戏结束状态。

### test_error_handling.ts
测试各种错误情况的处理，包括游戏不存在、角色不存在和无效选项等情况。

### test_transaction.ts
测试数据库事务功能，验证多个相关操作是否能够作为一个原子单元执行，并在出错时正确回滚。

### test_character_status_update.ts
测试角色状态更新功能，验证不同类型的状态变化是否正确应用到角色身上。

## 注意事项

1. 测试脚本中的角色ID和游戏ID需要根据实际情况修改。
2. 部分测试可能会修改数据库中的数据，请在测试环境中运行。
3. 测试完成后，部分脚本会尝试恢复原始状态，但不保证完全恢复。 