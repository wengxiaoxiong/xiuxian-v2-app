import { deepseek } from "@ai-sdk/deepseek"
import { PrismaClient } from "../generated/prisma"
import { generateText } from "ai"


const prisma = new PrismaClient()

const character_prompt = "character_prompt"

// 获取所有字典项
export async function getDicts() {
  try {
    const dicts = await prisma.dictionary.findMany({
      orderBy: {
        id: 'asc'
      }
    })

  } catch (error) {
    console.error('获取字典数据失败:', error)
    throw new Error('获取字典数据失败')
  }

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt: "What is love?"
    })
    return text
}
