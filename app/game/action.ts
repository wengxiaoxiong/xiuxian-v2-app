/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod"
import { CharacterDescriptionSchema, CharacterStatusSchema, getCharacterById, updateCharacterStatus } from "../character/action";
import deepseek from "@/utils/deepseek";
import { generateObject } from "ai";
import { PrismaClient } from "../generated/prisma";


const prisma = new PrismaClient()

const story_prompt = "story_prompt"
const summary_prompt = "summary_prompt"

const storyPushSchema = z.object({
    节点要素: z.object({
        基础信息: z.object({
            类型: z.enum(["主线", "机缘", "危机", "日常", "转折"]),
            等级: z.enum(["炼气", "筑基", "金丹", "元婴", "化神", "炼虚", "合体", "渡劫", "真仙"]),
            年龄: z.number(),
            任务是否完成: z.boolean()
        }),
        剧情要素: z.object({
            描述: z.string(),
            场景: z.array(z.string()),
            人物: z.array(z.string()),
            状态变化: z.object({
                体魄变化: z.union([
                    z.tuple([z.literal("无变化")]),
                    z.tuple([z.enum(["减少", "增加"]), z.enum(["一点", "中等", "多", "极多", "全部"])])
                ]),
                灵力变化: z.union([
                    z.tuple([z.literal("无变化")]),
                    z.tuple([z.enum(["减少", "增加"]), z.enum(["一点", "中等", "多", "极多", "全部"])])
                ]),
                道心变化: z.union([
                    z.tuple([z.literal("无变化")]),
                    z.tuple([z.enum(["减少", "增加"]), z.enum(["一点", "中等", "多", "极多", "全部"])])
                ]),
                寿元上限变化: z.union([
                    z.tuple([z.literal("无变化")]),
                    z.tuple([z.enum(["减少", "增加"]), z.enum(["一点", "中等", "多", "极多", "全部"])])
                ]),
                突破成功率变化: z.union([
                    z.tuple([z.literal("无变化")]),
                    z.tuple([z.enum(["减少", "增加"]), z.enum(["一点", "中等", "多", "极多", "全部"])])
                ])
            }),
            玩家选项: z.array(z.string())
        })
    })
})

export type StoryPushType = z.infer<typeof storyPushSchema>;

const summaryPushSchema = z.object({
    剧情要素: z.object({
        描述: z.string(),
        场景: z.array(z.string()),
        人物: z.array(z.string()),
    })
})

export type SummaryPushType = z.infer<typeof summaryPushSchema>;

/**
 * @Action 开始游戏
 * @param characterId 角色id
 * @returns 
 */
export async function startGame(characterId: number) {
    const character = await getCharacterById(characterId)
    const characterStatusSchema = CharacterStatusSchema.safeParse(character.status)
    if (characterStatusSchema.data?.是否死亡) {
        throw new Error("角色已死亡")
    }

    // 去除description中的'初始属性'和'人物年龄'字段
    const characterDescriptionSchema = CharacterDescriptionSchema.safeParse(character.description)
    if (!characterDescriptionSchema.success) {
        throw new Error("角色描述解析失败")
    }
    const { 初始属性, 人物年龄, ...restDescription } = characterDescriptionSchema.data
    const characterDescription = restDescription

    const currentStatus = characterStatusSchema.data

    const dynamicInput = `
    当前角色状态: ${JSON.stringify(currentStatus)}
    `

    console.log(dynamicInput)


    const dict = await prisma.dictionary.findFirst({
        where: {
            key: story_prompt
        }
    })

    if (!dict) {
        throw new Error("没有找到Prompt角色描述")
    }
    let prompt = dict.value.replace("{CHARACTER_DESCRIPTION}", JSON.stringify(characterDescription))
    prompt = prompt.replace("{DYNAMIC_INPUT}", dynamicInput)

    const { object: gamePush } = await generateObject({
        model: deepseek("deepseek-chat"),
        maxTokens: 3000,
        schema: storyPushSchema,
        prompt: prompt
    })

    // 创建游戏记录
    const game = await prisma.game.create({
        data: {
            characterId: characterId,
            isEnded: false,
            gamePush: {
                create: {
                    push: gamePush,
                    sortIndex: 0 // 初始节点的排序索引设为0
                }
            }
        },
        include: {
            gamePush: true
        }
    })

    // 更新角色状态
    const newStatus = await updateCharacterStatus(characterId, gamePush)

    console.log(`
        更新后状态: ${JSON.stringify(newStatus)}
    `)

    return {
        id: game.id,
        gamePush: gamePush,
        newStatus: newStatus
    }
}

/**
 * @Action 推进游戏
 * @param gameId 游戏id
 * @param characterId 角色id
 * @param gamePush 游戏推送到
 * @returns 
 */
export async function pushGame(gameId: number, characterId: number, choice: string) {

    const game = await prisma.game.findFirst({
        where: {
            id: gameId
        },
        include: {
            gamePush: {
                where: {
                    isSummary: false
                },
                orderBy: {
                    sortIndex: 'asc'
                }
            }
        }
    })

    if (!game) {
        throw new Error("游戏不存在")
    }

    // gamePush不能为空
    if (!game.gamePush || game.gamePush.length === 0) {
        throw new Error("游戏推送不能为空")
    }

    let gameContext = game.gamePush.map((push) => {
        const pushData = push.push
        const storyPush = storyPushSchema.safeParse(pushData)
        if (!storyPush.success) {
            const summaryPush = summaryPushSchema.safeParse(pushData)
            if (!summaryPush.success) {
                throw new Error("游戏推送数据格式错误")
            }
            return JSON.stringify(summaryPush.data.剧情要素)
        }
        const { 节点要素 } = storyPush.data
        const { 剧情要素 } = 节点要素

        return JSON.stringify(剧情要素)
    }).join("\n")

    // 判断game.gamePush是否超过3个节点，若超过则总结前2个节点
    if (game.gamePush.length >= 3) {
        // 获取前2个节点
        const nodesToSummarize = game.gamePush.slice(0, 2)
        // 获取当前最小的sortIndex，用于总结节点，只考虑非总结节点
        const minSortIndex = await prisma.gamePush.findFirst({
            where: { 
                gameId,
                isSummary: false // 只查询非总结节点
            },
            orderBy: { sortIndex: 'asc' },
            select: { sortIndex: true }
        });
        // 新的总结节点应该比最小的索引还要小
        const summaryIndex = (minSortIndex?.sortIndex || 0) - 1;

        const dict = await prisma.dictionary.findFirst({
            where: {
                key: summary_prompt
            }
        })

        if (!dict) {
            throw new Error("没有找到Prompt角色描述")
        }

        const summaryContext = nodesToSummarize.map((push) => {
            const pushData = push.push
            const storyPush = storyPushSchema.safeParse(pushData)
            if (!storyPush.success) {
                const summaryPush = summaryPushSchema.safeParse(pushData)
                if (!summaryPush.success) {
                    throw new Error("游戏推送数据格式错误")
                }
                return JSON.stringify(summaryPush.data.剧情要素)
            }
            
            const { 节点要素 } = storyPush.data
            const { 剧情要素 } = 节点要素
            return JSON.stringify(剧情要素)
        }).join("\n")

        console.log("summaryContext")
        console.log(summaryContext)

        const prompt = dict.value.replace("{SUMMARY_CONTEXT}", summaryContext)

        const { object: summaryPush } = await generateObject({
            model: deepseek("deepseek-chat"),
            maxTokens: 3000,
            schema: summaryPushSchema,
            prompt: prompt
        })

        console.log(`
            浓缩剧情: ${JSON.stringify(summaryPush)}
        `)

        // 将前2个节点标记为已总结
        await Promise.all(nodesToSummarize.map(node => 
            prisma.gamePush.update({
                where: {
                    id: node.id
                },
                data: {
                    isSummary: true
                }
            })
        ))

        // 添加总结的节点，设置动态的排序索引，确保它在最前面且总结节点之间有序
        await prisma.gamePush.create({
            data: {
                gameId: gameId,
                push: summaryPush,
                isSummary: false,
                sortIndex: summaryIndex  // 使用动态计算的索引值
            }
        })

        // 重新获取最新的非总结节点，按排序索引排序
        const updatedPushes = await prisma.gamePush.findMany({
            where: {
                gameId: gameId,
                isSummary: false
            },
            orderBy: {
                sortIndex: 'asc'
            }
        })

        gameContext = updatedPushes.map((push) => JSON.stringify(push.push)).join("\n")
    }

    const character = await getCharacterById(characterId)
    const characterStatusSchema = CharacterStatusSchema.safeParse(character.status)
    if (characterStatusSchema.data?.是否死亡) {
        throw new Error("角色已死亡")
    }

    // 去除description中的'初始属性'和'人物年龄'字段
    const characterDescriptionSchema = CharacterDescriptionSchema.safeParse(character.description)
    if (!characterDescriptionSchema.success) {
        throw new Error("角色描述解析失败")
    }
    const { 初始属性, 人物年龄, ...restDescription } = characterDescriptionSchema.data
    const characterDescription = restDescription

    const currentStatus = characterStatusSchema.data

    const dynamicInput = `
    当前角色状态: ${JSON.stringify(currentStatus)}
    玩家选择: ${choice}
    游戏上下文: ${JSON.stringify(gameContext)}
    `

    console.log(dynamicInput)

    const dict = await prisma.dictionary.findFirst({
        where: {
            key: story_prompt
        }
    })

    if (!dict) {
        throw new Error("没有找到Prompt角色描述")
    }

    let prompt = dict.value
    prompt = prompt.replace("{CHARACTER_DESCRIPTION}", JSON.stringify(characterDescription))
    prompt = prompt.replace("{DYNAMIC_INPUT}", dynamicInput)

    const { object: gamePush } = await generateObject({
        model: deepseek("deepseek-chat"),
        maxTokens: 3000,
        schema: storyPushSchema,
        prompt: prompt
    })

    // 更新角色状态
    const newStatus = await updateCharacterStatus(characterId, gamePush)

    console.log(`
        更新后状态: ${JSON.stringify(newStatus)}
    `)

    // 获取当前最大的sortIndex
    const maxSortIndex = await prisma.gamePush.findFirst({
        where: { 
            gameId,
            isSummary: false // 只查询非总结节点
        },
        orderBy: { sortIndex: 'desc' },
        select: { sortIndex: true }
    });
    const newSortIndex = (maxSortIndex?.sortIndex || 0) + 1;

    // 更新游戏状态
    await prisma.game.update({
        where: {
            id: gameId
        },
        data: {
            gamePush: {
                create: {
                    push: gamePush,
                    sortIndex: newSortIndex  // 使用递增的sortIndex确保新节点排在最后
                }
            }
        }
    })
    

    return {
        id: game.id,
        gamePush: gamePush,
        newStatus: newStatus
    }
}