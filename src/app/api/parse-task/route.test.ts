import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// LLMパーサーをモック
vi.mock('@/lib/llm-parser-simple', () => ({
  parseTaskWithLLM: vi.fn(),
}))

import { parseTaskWithLLM } from '@/lib/llm-parser-simple'

describe('POST /api/parse-task', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/parse-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('should return 400 when input is missing', async () => {
    const request = createRequest({
      config: { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_INPUT')
    expect(data.error.message).toBe('Missing input or config')
  })

  it('should return 400 when config is missing', async () => {
    const request = createRequest({
      input: '新宿で山田とごはん',
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_INPUT')
    expect(data.error.message).toBe('Missing input or config')
  })

  it('should parse task successfully with valid input', async () => {
    const mockResult = {
      taskInfo: {
        title: '新宿で山田とごはん',
        category: 'personal',
        scheduledDate: '2026-02-01',
        scheduledTime: '15:00',
        deadline: null,
        durationMinutes: null,
      },
      missingFields: [],
      nextQuestion: null,
      clarificationOptions: ['登録する', '登録しない'],
      isComplete: true,
      rawInput: '新宿で山田とごはん',
      conversationContext: '新宿で山田とごはん',
    }

    vi.mocked(parseTaskWithLLM).mockResolvedValue(mockResult)

    const request = createRequest({
      input: '新宿で山田とごはん',
      config: { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockResult)
    expect(parseTaskWithLLM).toHaveBeenCalledWith(
      '新宿で山田とごはん',
      { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
      '',
      {}
    )
  })

  it('should parse task with previous context', async () => {
    const mockResult = {
      taskInfo: {
        title: 'お茶を買う',
        category: 'shopping',
        scheduledDate: null,
        scheduledTime: null,
        deadline: null,
        durationMinutes: null,
      },
      missingFields: ['scheduledDate'],
      nextQuestion: 'いつ実行する予定ですか？',
      clarificationOptions: ['今日', '明日', '今週中', '未定', '登録しない'],
      isComplete: false,
      rawInput: 'お茶を買う',
      conversationContext: 'お茶を買う',
    }

    vi.mocked(parseTaskWithLLM).mockResolvedValue(mockResult)

    const request = createRequest({
      input: 'お茶を買う',
      config: { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
      previousContext: '前回のタスク',
      currentTaskInfo: { title: 'お茶を買う', category: 'shopping' },
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(parseTaskWithLLM).toHaveBeenCalledWith(
      'お茶を買う',
      { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
      '前回のタスク',
      { title: 'お茶を買う', category: 'shopping' }
    )
  })

  it('should handle LLM errors gracefully', async () => {
    vi.mocked(parseTaskWithLLM).mockRejectedValue(new Error('LLM API Error'))

    const request = createRequest({
      input: 'タスク入力',
      config: { apiKey: 'test', model: 'gpt-4', provider: 'openai' },
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error.code).toBeDefined()
    expect(data.error.message).toContain('LLM API Error')
  })
})
