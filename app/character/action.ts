import { PrismaClient } from "../generated/prisma"
import { generateObject } from "ai"
import deepseek from "@/utils/deepseek"
import { z } from "zod"

const prisma = new PrismaClient()

const character_prompt = "character_prompt"

// 定义角色信息类型
const CharacterSchema = z.object({
    角色名称: z.string(),
    人物背景: z.string(),
    外貌特征: z.string(),
    灵根属性: z.string(),
    人物年龄: z.number(),
    初始属性: z.object({
        灵根: z.string(),
        年龄: z.number(),
        修为: z.string()
    }),
    人物内在的驱动力: z.string(),
    人物使命与当前阶段: z.string(),
    核心任务: z.string(),
    人物性格: z.array(z.string()),
    人物能力: z.object({
        已掌握能力: z.array(z.string()),
        能力限制: z.array(z.string()),
        成长潜能: z.array(z.string())
    }),
    人物关系: z.array(z.string()),
    人物讨人喜欢的点: z.array(z.string()),
    故事大纲: z.string()
});

export type CharacterType = z.infer<typeof CharacterSchema>;

export async function createCharacter(name: string): Promise<CharacterType | string> {
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

    const { object } = await generateObject({
        model: deepseek("deepseek-chat"),
        schema: CharacterSchema,
        prompt: prompt
    })

    // 将生成的角色信息存储到character表
    await prisma.character.create({
        data: {
            name: name,
            description: object, // 将对象转为字符串存储
            cover: "" // 可以根据需要添加封面图片URL
        }
    })

    console.log(object)
    return object
}
