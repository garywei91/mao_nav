import assistantSource from '../../imports/lkxzsbot-staging.json'

const categoryIcons = {
  '餐厅饭店': '🍜',
  '租房': '🏠',
  '购物': '🛒',
  '签证': '🛂',
  '换汇': '💱',
  '物流跑腿': '📦',
  '医院': '🏥',
  '美容美发': '💇',
  '按摩': '💆',
  '会所KTV': '🎤',
}

const clean = (value = '') => String(value).trim()

const slug = (value) => clean(value)
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
  .replace(/^-+|-+$/g, '')

const telegramUrl = (username = '') => {
  const value = clean(username).replace(/^@/, '')
  return value ? `https://t.me/${value}` : ''
}

function detailFor(name, category) {
  return assistantSource.details.find((item) => item.name === name && item.category === category) || {}
}

function descriptionFor(detail) {
  const lines = [clean(detail.description)]
  if (detail.hours) lines.push(`营业时间：${detail.hours}`)
  if (detail.status) lines.push(`状态：${detail.status}`)
  if (detail.phone) lines.push(`电话：${detail.phone}`)
  if (detail.address) lines.push(`地址：${detail.address}`)
  return lines.filter(Boolean).join('\n') || '收录自兰卡小助手目录；请联系商家确认服务内容和营业状态。'
}

function assistantCategories() {
  return assistantSource.categories.map((category, categoryIndex) => ({
    id: `lanka-assistant-${slug(category.name)}`,
    name: category.name,
    icon: categoryIcons[category.name] || '📍',
    order: categoryIndex,
    sites: category.items.map((name, siteIndex) => {
      const detail = detailFor(name, category.name)
      const contactUrl = telegramUrl(detail.telegram)
      return {
        id: `lanka-assistant-${slug(category.name)}-${siteIndex + 1}`,
        name,
        url: contactUrl || detail.map_url || '#',
        contactUrl,
        channelUrl: contactUrl,
        mapUrl: detail.map_url || '',
        description: descriptionFor(detail),
        // 统一品牌封面作为默认图片；后台可逐条改为商家授权图。
        icon: '/logo-lanka68.png',
        source: '兰卡小助手',
      }
    }),
  }))
}

export function withLankaAssistantCatalog(data) {
  return {
    ...data,
    title: '兰卡68',
    // 以兰卡小助手目录作为唯一商家数据源，避免和旧目录叠加重复。
    categories: assistantCategories(),
  }
}
