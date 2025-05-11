import { Character, PrismaClient } from "../generated/prisma"
import { generateObject } from "ai"
import deepseek from "@/utils/deepseek"
import { z } from "zod"

const prisma = new PrismaClient()

const character_prompt = "character_prompt"

// 定义角色信息类型
const CharacterDescriptionSchema = z.object({
    角色名称: z.string(),
    人物背景: z.string(),
    外貌特征: z.string(),
    灵根属性: z.string(),
    人物年龄: z.number(),
    初始属性: z.object({
        灵根: z.enum(["金", "木", "水", "火", "土"]),
        年龄: z.number(),
        修为: z.enum(["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"])
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


// 定义角色状态类型
const CharacterStatusSchema = z.object({
    灵根属性: z.enum(["金", "木", "水", "火", "土"]),
    等级: z.enum(["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"]),
    突破成功系数: z.number().min(0).max(1).default(0),
    年龄: z.number().min(0).default(0),
    寿元: z.number().min(0).default(100),
    体魄: z.number().int().min(0).default(40),
    道心: z.number().min(0).max(3).default(3),
    灵力: z.number().int().min(0).default(40)
});


export type CharacterDescriptionType = z.infer<typeof CharacterDescriptionSchema>;
export type CharacterStatusType = z.infer<typeof CharacterStatusSchema>;

export async function createCharacter(name: string): Promise<Character> {
    const USER_INPUT = "为" + name + "撰写角色档案和故事梗概，不论你让ta当主角配角，都要让ta活得精彩。"

    const dict = await prisma.dictionary.findFirst({
        where: {
            key: character_prompt
        }
    })

    if (!dict) {
        throw new Error("没有找到Prompt角色描述")
    }

    const prompt_template = dict.value
    const prompt = prompt_template.replace("{USER_INPUT}", USER_INPUT)

    const { object } = await generateObject({
        model: deepseek("deepseek-chat"),
        schema: CharacterDescriptionSchema,
        prompt: prompt
    })

    // 创建初始状态
    const initialStatus = CharacterStatusSchema.parse({
        灵根属性: object.初始属性.灵根,
        等级: object.初始属性.修为
    })

    // 将生成的角色信息存储到character表
    const character = await prisma.character.create({
        data: {
            name: name,
            description: object,
            status: initialStatus, // 添加status字段
            cover: ""
        }
    })

    return character
}


export async function getCharacter(name: string): Promise<Character> {
    const character = await prisma.character.findFirst({
        where: {
            name: name
        }
    })

    if (!character) {
        throw new Error("没有找到角色")
    }
    // 使用CharacterSchema解析Json类型的description
    const parsedDescription = CharacterDescriptionSchema.safeParse(character.description)

    if (!parsedDescription.success) {
        throw new Error("角色数据格式错误")
    }

    return {
        ...character,
        description: parsedDescription.data
    }
}



export async function getCharacterById(id: number): Promise<Character> {
    const character = await prisma.character.findFirst({
        where: {
            id: id
        }
    })

    if (!character) {
        throw new Error("没有找到角色")
    }

    // 使用CharacterSchema解析Json类型的description
    const parsedDescription = CharacterDescriptionSchema.safeParse(character.description)
    
    if (!parsedDescription.success) {
        throw new Error("角色数据格式错误")
    }

    return {
        ...character,
        description: parsedDescription.data
    }
}