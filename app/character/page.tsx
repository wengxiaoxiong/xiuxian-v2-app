'use client'
import { useState } from 'react'
import { createCharacter } from "./action"

export default function CharacterPage() {
  const [inputValue, setInputValue] = useState('')
  const [characterText, setCharacterText] = useState('')

  const handleCreateCharacter = async () => {
    const text = await createCharacter(inputValue)
    setCharacterText(text)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">角色信息</h1>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入角色名称"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleCreateCharacter}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          生成角色
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <pre className="whitespace-pre-wrap">{characterText}</pre>
      </div>
    </div>
  )
}
