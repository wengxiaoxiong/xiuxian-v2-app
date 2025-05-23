import { Character, PrismaClient } from "../generated/prisma"
import { generateObject } from "ai"
import deepseek from "@/utils/deepseek"
import { z } from "zod"
import { StoryPushType } from "../game/action"
import { getAttributeLimitsByLevel } from "./constants"

const prisma = new PrismaClient()

const character_prompt = "character_prompt"

// 定义角色信息类型
export const CharacterDescriptionSchema = z.object({
    角色名称: z.string(),
    人物背景: z.string(),
    外貌特征: z.string(),
    灵根属性: z.string(),
    人物年龄: z.number(),
    初始属性: z.object({
        灵根: z.enum(["金", "木", "水", "火", "土"]),
        年龄: z.number(),
        等级: z.enum(["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"])
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
export const CharacterStatusSchema = z.object({
    灵根属性: z.enum(["金", "木", "水", "火", "土"]),
    等级: z.enum(["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"]),
    突破成功系数: z.number().min(0).max(1).default(0),
    年龄: z.number().min(0).default(0),
    寿元: z.number().min(0).max(1000).default(100),
    体魄: z.number().min(0).max(300).default(40),
    道心: z.number().min(0).max(7).default(3),
    灵力: z.number().min(0).default(40),
    是否死亡: z.boolean().default(false)
});


export type CharacterDescriptionType = z.infer<typeof CharacterDescriptionSchema>;
export type CharacterStatusType = z.infer<typeof CharacterStatusSchema>;

/**
 * @Action 创建角色
 * @param name 角色名字
 * @returns 创建好的角色对象
 */
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
        等级: object.初始属性.等级,
        年龄: object.初始属性.年龄
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

/**
 * @Action 获取角色ByName
 * @param name 角色名称
 * @returns 
 */
export async function getCharacterByName(name: string): Promise<Character> {
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


/**
 * @Action 获取角色ByID
 * @param id 
 * @returns 
 */
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
    const parsedStatus = CharacterStatusSchema.safeParse(character.status)
    if (!parsedDescription.success) {
        throw new Error("角色数据格式错误")
    }
    if (!parsedStatus.success) {
        throw new Error("角色状态数据格式错误")
    }

    return {
        ...character,
        description: parsedDescription.data,
        status: parsedStatus.data
    }
}

/**
 * @Action 获取角色状态ByID
 * @param id 
 * @returns 角色状态ZOD
 */
export async function getCharacterStatus(id: number): Promise<CharacterStatusType> {
    const character = await prisma.character.findFirst({
        where: {
            id: id
        }
    })

    if (!character) {
        throw new Error("没有找到角色")
    }

    const parsedStatus = CharacterStatusSchema.safeParse(character.status)

    if (!parsedStatus.success) {
        throw new Error("角色状态数据格式错误")
    }

    return parsedStatus.data
}

// 根据变化程度获取基础值和变化百分比
function getChangeValueByDegree(degree: string, attribute: string): { 基础值: number[], 变化百分比: number } {
    // 对道心特殊处理
    if (attribute === "道心") {
        switch (degree) {
            case "一点":
            case "中等":
                return { 基础值: [0.5, 0.5], 变化百分比: 0 }; // 道心基础值固定为0.5
            case "多":
            case "极多":
                return { 基础值: [1, 1], 变化百分比: 0 }; // 道心基础值固定为1
            default:
                return { 基础值: [0, 0], 变化百分比: 0 };
        }
    }

    // 对其他属性通用处理
    switch (degree) {
        case "一点":
            return { 基础值: [1, 2], 变化百分比: 0.05 };
        case "中等":
            return { 基础值: [3, 4], 变化百分比: 0.1 };
        case "多":
            return { 基础值: [5, 7], 变化百分比: 0.15 };
        case "极多":
            return { 基础值: [8, 10], 变化百分比: 0.2 };
        case "全部":
            return { 基础值: [], 变化百分比: 0 }; // 全部会有特殊处理
        default:
            return { 基础值: [0, 0], 变化百分比: 0 };
    }
}

// 获取随机的基础值
function getRandomBaseValue(range: number[]): number {
    if (range.length < 2) return 0;
    const min = range[0];
    const max = range[1];
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 根据属性、变化方向、变化程度计算属性变化值
function calculateAttributeChange(attribute: string, currentValue: number, direction: "增加" | "减少", degree: string, level: string): number {
    // 如果是"全部"，且是减少，特殊处理
    if (degree === "全部" && direction === "减少") {
        if (attribute === "体魄") return -currentValue; // 清空体魄
        return 0; // 其他属性不处理全部减少
    }

    const { 基础值, 变化百分比 } = getChangeValueByDegree(degree, attribute);
    
    // 获取随机基础值
    const baseValue = attribute === "道心" 
        ? 基础值[0]  // 道心直接取固定值
        : getRandomBaseValue(基础值);
    
    // 根据公式计算变化值
    let changeValue = 0;
    
    // 突破率计算需要考虑突破难度
    if (attribute === "突破成功系数") {
        // 根据等级计算突破难度系数：越高等级，突破越难
        const levelDifficulty = {
            "炼气": 1,
            "筑基": 1.2,
            "金丹": 1.5,
            "元婴": 1.8,
            "化神": 2.1,
            "炼虚": 2.5,
            "合体": 3,
            "渡劫": 3.5,
            "真仙": 4
        }[level] || 1;
        
        changeValue = baseValue * levelDifficulty / 100; // 按百分比
    } else if (attribute === "道心") {
        // 道心只加减基础值
        changeValue = baseValue;
    } else {
        // 寿元、体魄、灵力的计算公式：基础值 + (当前值 * 变化百分比)
        changeValue = baseValue + (currentValue * 变化百分比);
    }
    
    return direction === "增加" ? changeValue : -changeValue;
}

// 处理角色状态变化
export async function updateCharacterStatus(characterId: number, storyPush: StoryPushType): Promise<CharacterStatusType> {
    // 获取角色当前状态
    const currentStatus = await getCharacterStatus(characterId);
    
    // 获取状态变化信息
    const { 状态变化 } = storyPush.节点要素.剧情要素;
    
    // 创建新的状态对象
    const newStatus: CharacterStatusType = { ...currentStatus };
    
    // 获取当前等级的属性限制
    const attributeLimits = getAttributeLimitsByLevel(currentStatus.等级);
    
    // 处理体魄变化
    if (状态变化.体魄变化[0] !== "无变化") {
        const [direction, degree] = 状态变化.体魄变化;
        const change = calculateAttributeChange("体魄", currentStatus.体魄, direction, degree, currentStatus.等级);
        newStatus.体魄 = Math.max(0, Math.min(attributeLimits.体魄.max, currentStatus.体魄 + change));
    }
    
    // 处理灵力变化
    if (状态变化.灵力变化[0] !== "无变化") {
        const [direction, degree] = 状态变化.灵力变化;
        const change = calculateAttributeChange("灵力", currentStatus.灵力, direction, degree, currentStatus.等级);
        newStatus.灵力 = Math.max(0, Math.min(attributeLimits.灵力.max, currentStatus.灵力 + change));
    }
    
    // 处理道心变化
    if (状态变化.道心变化[0] !== "无变化") {
        const [direction, degree] = 状态变化.道心变化;
        const change = calculateAttributeChange("道心", currentStatus.道心, direction, degree, currentStatus.等级);
        newStatus.道心 = Math.max(0, Math.min(attributeLimits.道心.max, currentStatus.道心 + change));
    }
    
    // 处理寿元变化
    if (状态变化.寿元上限变化[0] !== "无变化") {
        const [direction, degree] = 状态变化.寿元上限变化;
        const change = calculateAttributeChange("寿元", currentStatus.寿元, direction, degree, currentStatus.等级);
        newStatus.寿元 = Math.max(0, Math.min(attributeLimits.寿元.max, currentStatus.寿元 + change));
    }
    
    // 处理突破成功率变化
    if (状态变化.突破成功率变化[0] !== "无变化") {
        const [direction, degree] = 状态变化.突破成功率变化;
        const change = calculateAttributeChange("突破成功系数", currentStatus.突破成功系数, direction, degree, currentStatus.等级);
        newStatus.突破成功系数 = Math.max(0, Math.min(1, currentStatus.突破成功系数 + change)); // 突破率范围为0-1
    }
    
    // 检查角色是否死亡
    if (newStatus.年龄 > newStatus.寿元 || newStatus.体魄 <= 0 || newStatus.道心 <= 0) {
        newStatus.是否死亡 = true;
    }
    
    // 更新角色状态到数据库
    await prisma.character.update({
        where: {
            id: characterId
        },
        data: {
            status: newStatus
        }
    });
    
    return newStatus;
}

/**
 * @Action 根据角色当前状态 来突破角色 目前可以直接随便给前端调用 没有做资格判断 后期补上
 * @param characterId 角色id
 * @returns 突破结果 和 最新状态
 */
export async function attemptBreakthrough(characterId: number): Promise<{ success: boolean, newStatus: CharacterStatusType, message: string }> {
    // TODO 突破资格判断
    
    // 获取角色当前状态
    const currentStatus = await getCharacterStatus(characterId);
    
    // 检查角色是否已死亡
    if (currentStatus.是否死亡) {
        return { 
            success: false, 
            newStatus: currentStatus,
            message: "角色已死亡，无法突破"
        };
    }
    
    // 复制当前状态
    const newStatus: CharacterStatusType = { ...currentStatus };
    
    // 获取当前等级和下一个等级
    const cultivationLevels = ["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"];
    const currentLevelIndex = cultivationLevels.indexOf(currentStatus.等级);
    
    // 如果已经是最高等级，无法继续突破
    if (currentLevelIndex === cultivationLevels.length - 1) {
        return { 
            success: false, 
            newStatus: currentStatus,
            message: "已达到最高等级"
        };
    }
    


    
    // 生成随机数判断是否突破成功
    const randomValue = Math.random();
    const isSuccessful = randomValue <= currentStatus.突破成功系数;
    
    if (isSuccessful) {
        // 突破成功，更新等级
        const nextLevel = cultivationLevels[currentLevelIndex + 1];
        newStatus.等级 = nextLevel as "炼气" | "筑基" | "金丹" | "元婴" | "化神" | "炼虚" | "合体" | "渡劫" | "真仙";
        
        // 获取下一个等级的属性限制
        const nextLevelLimits = getAttributeLimitsByLevel(newStatus.等级);
        
        // 确保所有属性不超过新等级的最大值
        newStatus.寿元 = Math.min(nextLevelLimits.寿元.max, newStatus.寿元);
        newStatus.道心 = Math.min(nextLevelLimits.道心.max, newStatus.道心);
        newStatus.体魄 = Math.min(nextLevelLimits.体魄.max, newStatus.体魄);
        newStatus.灵力 = Math.min(nextLevelLimits.灵力.max, newStatus.灵力);
        
        // 更新数据库
        await prisma.character.update({
            where: {
                id: characterId
            },
            data: {
                status: newStatus
            }
        });
        
        return { 
            success: true, 
            newStatus,
            message: `突破成功！修为已提升至${nextLevel}期`
        };
    } else {
        // 突破失败，突破成功系数提升0.05
        newStatus.突破成功系数 += 0.05;
        
        // 更新数据库
        await prisma.character.update({
            where: {
                id: characterId
            },
            data: {
                status: newStatus
            }
        });
        
        return { 
            success: false, 
            newStatus,
            message: "突破失败，突破成功系数+0.05"
        };
    }
}