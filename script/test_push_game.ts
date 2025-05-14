import { pushGame } from "@/app/game/action"

async function main() {
    // current time 
    const currentTime = new Date().toISOString()
    console.log("开始时间:", currentTime)

    try {
        // 这里需要替换为实际的gameId和characterId
        const gameId = 3
        const characterId = 4
        const choice = "继续深入探索禁地，寻找更多关于红领巾的线索。" // 替换为实际的选项

        console.log(`测试推进游戏: gameId=${gameId}, characterId=${characterId}, choice=${choice}`)
        
        const game = await pushGame(gameId, characterId, choice)
        console.log("游戏推进结果:")
        console.log(JSON.stringify(game, null, 2))
    } catch (error) {
        console.error("错误:", error)
    }

    // end time
    const endTime = new Date().toISOString()
    console.log("结束时间:", endTime)

    // 计算时间差
    const timeDiff = new Date(endTime).getTime() - new Date(currentTime).getTime()
    console.log(`执行时间: ${timeDiff / 1000} 秒`)
}

main() 