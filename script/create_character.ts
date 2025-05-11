import {
    createCharacter
} from "@/app/character/action"

async function main() {

    // current time 
    const currentTime = new Date().toISOString()
    console.log(currentTime)

    const text = await createCharacter("没带红领巾的 张三")
    console.log(text)

    // end time
    const endTime = new Date().toISOString()
    console.log(endTime)

    // 计算时间差
    const timeDiff = new Date(endTime).getTime() - new Date(currentTime).getTime()
    console.log(`时间差: ${timeDiff / 1000} 秒`)
}

main()