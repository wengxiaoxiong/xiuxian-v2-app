import { createCharacter } from "./action"

export default async function CharacterPage() {
  const characterText = await createCharacter("没带红领巾的 张三")

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">角色信息</h1>
      <div className="bg-white p-4 rounded shadow">
        <pre className="whitespace-pre-wrap">{characterText}</pre>
      </div>
    </div>
  )
}
