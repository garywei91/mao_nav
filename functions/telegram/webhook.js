import { mockData } from '../../src/mock/mock_data.js'

const TELEGRAM_API = 'https://api.telegram.org'
const MAX_RESULTS = 8

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function safeEqual(left, right) {
  if (!left || !right) return false
  const encoder = new TextEncoder()
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  if (a.length !== b.length) return false

  let difference = 0
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index]
  return difference === 0
}

function normalize(value) {
  return String(value || '').trim().toLocaleLowerCase('zh-CN')
}

function categories() {
  return mockData.categories || []
}

function inlineKeyboard(rows) {
  return { inline_keyboard: rows }
}

function categoryKeyboard() {
  return inlineKeyboard(
    categories()
      .slice(0, 12)
      .map((category) => [{ text: `${category.icon || '📍'} ${category.name.trim()}`, callback_data: `category:${category.id}` }]),
  )
}

function compactDescription(description) {
  const text = String(description || '').replace(/\s+/g, ' ').trim()
  return text.length > 220 ? `${text.slice(0, 217)}…` : text
}

function formatSite(site, categoryName) {
  const lines = [`✨ ${site.name}`, `📂 ${categoryName}`]
  const description = compactDescription(site.description)
  if (description) lines.push(`📝 ${description}`)
  return lines.join('\n')
}

function siteButtons(site) {
  const rows = []
  if (site.url) rows.push([{ text: '联系商家', url: site.url }])
  rows.push([{ text: '打开兰卡68网站', url: 'https://lanka68.com' }])
  return inlineKeyboard(rows)
}

async function telegram(env, method, body) {
  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error(JSON.stringify({ event: 'telegram_api_error', method, status: response.status, detail: detail.slice(0, 500) }))
  }
}

async function sendWelcome(env, chatId, firstName) {
  const greeting = firstName ? `你好，${firstName}！` : '你好！'
  await telegram(env, 'sendMessage', {
    chat_id: chatId,
    text: `${greeting}\n\n🇱🇰 欢迎使用兰卡68小助手\n输入商家名称、服务或分类即可搜索，例如：餐厅、租房、快递、换汇。\n\n也可以直接选择分类：`,
    reply_markup: categoryKeyboard(),
  })
}

async function sendCategory(env, chatId, categoryId) {
  const category = categories().find((item) => item.id === categoryId)
  if (!category) return

  const sites = (category.sites || []).slice(0, MAX_RESULTS)
  if (sites.length === 0) {
    await telegram(env, 'sendMessage', { chat_id: chatId, text: '这个分类暂时没有可展示的商家。' })
    return
  }

  await telegram(env, 'sendMessage', {
    chat_id: chatId,
    text: `${category.icon || '📍'} ${category.name.trim()}\n为你找到 ${category.sites.length} 家商家，先展示前 ${sites.length} 家：`,
  })

  for (const site of sites) {
    await telegram(env, 'sendMessage', {
      chat_id: chatId,
      text: formatSite(site, category.name.trim()),
      reply_markup: siteButtons(site),
      disable_web_page_preview: true,
    })
  }
}

function searchSites(query) {
  const needle = normalize(query)
  if (!needle) return []

  return categories().flatMap((category) =>
    (category.sites || [])
      .filter((site) => normalize(`${category.name} ${site.name} ${site.description}`).includes(needle))
      .map((site) => ({ site, category })),
  ).slice(0, MAX_RESULTS)
}

async function sendSearchResults(env, chatId, query) {
  const results = searchSites(query)
  if (results.length === 0) {
    await telegram(env, 'sendMessage', {
      chat_id: chatId,
      text: `没有找到“${query}”。你可以试试：餐厅、超市、租房、快递、签证或换汇。`,
      reply_markup: categoryKeyboard(),
    })
    return
  }

  await telegram(env, 'sendMessage', { chat_id: chatId, text: `找到 ${results.length} 条与“${query}”相关的结果：` })
  for (const { site, category } of results) {
    await telegram(env, 'sendMessage', {
      chat_id: chatId,
      text: formatSite(site, category.name.trim()),
      reply_markup: siteButtons(site),
      disable_web_page_preview: true,
    })
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  // Temporary activation hook used only while binding the Telegram webhook.
  // It is removed immediately after the binding succeeds.
  if (url.searchParams.get('activate') === '1') {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
      return json({ ok: false, error: 'Telegram bot secrets are not configured.' }, 503)
    }

    const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${url.origin}/telegram/webhook`,
        secret_token: env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query'],
        drop_pending_updates: true,
      }),
    })
    const result = await response.json().catch(() => ({ ok: false }))
    return json({ ok: Boolean(result.ok) }, result.ok ? 200 : 502)
  }

  return json({ ok: true, service: 'lanka68-telegram-bot' })
}

export async function onRequestPost({ request, env }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ ok: false, error: 'Telegram bot secrets are not configured.' }, 503)
  }

  const signature = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || ''
  if (!safeEqual(signature, env.TELEGRAM_WEBHOOK_SECRET)) return json({ ok: false }, 401)

  let update
  try {
    update = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON.' }, 400)
  }

  try {
    if (update.callback_query) {
      const callback = update.callback_query
      const [kind, value] = String(callback.data || '').split(':', 2)
      await telegram(env, 'answerCallbackQuery', { callback_query_id: callback.id })
      if (kind === 'category') await sendCategory(env, callback.message.chat.id, value)
      return json({ ok: true })
    }

    const message = update.message
    const text = String(message?.text || '').trim()
    if (!message?.chat?.id || !text) return json({ ok: true })

    if (text === '/start' || text.startsWith('/start ')) {
      await sendWelcome(env, message.chat.id, message.from?.first_name)
    } else if (text === '/categories') {
      await telegram(env, 'sendMessage', { chat_id: message.chat.id, text: '选择一个分类：', reply_markup: categoryKeyboard() })
    } else {
      await sendSearchResults(env, message.chat.id, text)
    }
  } catch (error) {
    console.error(JSON.stringify({ event: 'update_failed', message: error instanceof Error ? error.message : String(error) }))
  }

  return json({ ok: true })
}
