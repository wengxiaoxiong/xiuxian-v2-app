
import { startGame } from "@/app/game/action"

async function main() {

    // current time 
    const currentTime = new Date().toISOString()
    console.log(currentTime)


    const game = await startGame(4)
    console.log(JSON.stringify(game))


    // end time
    const endTime = new Date().toISOString()
    console.log(endTime)

    // 计算时间差
    const timeDiff = new Date(endTime).getTime() - new Date(currentTime).getTime()
    console.log(`时间差: ${timeDiff / 1000} 秒`)
}

main()