import { createCharacter } from "@/app/character/action"

const text = await createCharacter("没带红领巾的 张三")
console.log(text)