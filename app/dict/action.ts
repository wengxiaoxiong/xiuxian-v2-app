import { PrismaClient } from "../generated/prisma"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

// 获取所有字典项
export async function getDicts() {
  try {
    const dicts = await prisma.dictionary.findMany({
      orderBy: {
        id: 'asc'
      }
    })
    return dicts
  } catch (error) {
    console.error('获取字典数据失败:', error)
    throw new Error('获取字典数据失败')
  }
}

// 获取单个字典项
export async function getDict(id: number) {
  try {
    const dict = await prisma.dictionary.findUnique({
      where: { id }
    })
    return dict
  } catch (error) {
    console.error('获取字典项失败:', error)
    throw new Error('获取字典项失败')
  }
}

// 创建字典项
export async function createDict(formData: FormData) {
  try {
    const key = formData.get('key') as string
    const value = formData.get('value') as string
    
    if (!key || !value) {
      throw new Error('键和值不能为空')
    }
    
    const dict = await prisma.dictionary.create({
      data: { key, value }
    })
    
    revalidatePath('/dict')
    return dict
  } catch (error) {
    console.error('创建字典项失败:', error)
    throw new Error('创建字典项失败')
  }
}

// 更新字典项
export async function updateDict(id: number, formData: FormData) {
  try {
    const key = formData.get('key') as string
    const value = formData.get('value') as string
    
    if (!key || !value) {
      throw new Error('键和值不能为空')
    }
    
    const dict = await prisma.dictionary.update({
      where: { id },
      data: { key, value }
    })
    
    revalidatePath('/dict')
    return dict
  } catch (error) {
    console.error('更新字典项失败:', error)
    throw new Error('更新字典项失败')
  }
}

// 删除字典项
export async function deleteDict(id: number) {
  try {
    await prisma.dictionary.delete({
      where: { id }
    })
    
    revalidatePath('/dict')
    return { success: true }
  } catch (error) {
    console.error('删除字典项失败:', error)
    throw new Error('删除字典项失败')
  }
}
