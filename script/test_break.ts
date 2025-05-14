import { PrismaClient } from '@/app/generated/prisma'
import { attemptBreakthrough, getCharacterById, CharacterStatusType } from '@/app/character/action'

// 初始化 Prisma 客户端
const prisma = new PrismaClient()

async function testBreakthrough() {
  // 角色ID设置为4
  const characterId = 4

  try {
    // 获取角色当前信息
    const character = await getCharacterById(characterId)
    
    // 确保 status 存在且类型正确
    if (!character.status) {
      throw new Error('角色状态信息不存在')
    }
    
    // 使用类型断言确保 TypeScript 正确识别类型
    const status = character.status as CharacterStatusType
    
    console.log('角色当前信息:', JSON.stringify({
      名称: character.name,
      等级: status.等级,
      突破成功系数: status.突破成功系数,
      体魄: status.体魄,
      灵力: status.灵力,
      道心: status.道心,
      寿元: status.寿元,
    }, null, 2))

    // 尝试进行突破
    console.log('开始尝试突破...')
    const result = await attemptBreakthrough(characterId)

    // 输出突破结果
    console.log('突破结果:', result.message)
    console.log('突破后状态:', JSON.stringify({
      等级: result.newStatus.等级,
      突破成功系数: result.newStatus.突破成功系数,
      体魄: result.newStatus.体魄,
      灵力: result.newStatus.灵力,
      道心: result.newStatus.道心,
      寿元: result.newStatus.寿元,
    }, null, 2))

  } catch (error) {
    console.error('突破过程中发生错误:', error)
  } finally {
    // 关闭 Prisma 客户端连接
    await prisma.$disconnect()
  }
}

// 执行测试
testBreakthrough()
  .then(() => console.log('测试完成'))
  .catch((error) => console.error('测试失败:', error))
