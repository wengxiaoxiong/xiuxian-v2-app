/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod"
import { CharacterDescriptionSchema, CharacterStatusSchema, getCharacterById, updateCharacterStatus } from "../character/action";
import deepseek from "@/utils/deepseek";
import { generateObject } from "ai";
import {  PrismaClient } from "../generated/prisma";


const prisma = new PrismaClient()

const story_prompt = "story_prompt"

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

    let prompt = story_prompt.replace("{CHARACTER_DESCRIPTION}", JSON.stringify(characterDescription))
    prompt = story_prompt.replace("{DYNAMIC_INPUT}", dynamicInput)

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
                    push: gamePush
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
