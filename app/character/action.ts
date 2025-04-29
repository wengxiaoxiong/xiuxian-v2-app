import { PrismaClient } from "../generated/prisma"
import { generateText } from "ai"
import deepseek from "@/utils/deepseek"

const prisma = new PrismaClient()

const character_prompt = "character_prompt"

// 创建角色
export async function createCharacter(name: string) {
    const USER_INPUT = "为" + name + "撰写角色档案和故事梗概，不论你让ta当主角配角，都要让ta活得精彩。"

    const dict = await prisma.dictionary.findFirst({
        where: {
            key: character_prompt
        }
    })

    if (!dict) {
        return "没有找到Prompt角色描述"
    }

    const prompt_template = dict.value
    const prompt = prompt_template.replace("{USER_INPUT}", USER_INPUT)

    console.log(prompt)
    const { text } = await generateText({
        model: deepseek("deepseek-chat"),
        prompt: prompt
    })
    console.log(text)

    // 将生成的角色信息存储到character表
    await prisma.character.create({
        data: {
            name: name,
            description: text,
            cover: "" // 可以根据需要添加封面图片URL
        }
    })

    return text
}
