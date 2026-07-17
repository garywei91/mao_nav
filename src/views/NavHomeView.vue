<template>
  <!-- 锁定界面 -->
  <div v-if="isLocked && !isUnlocked" class="lock-container">
    <div class="lock-box">
      <h1>🔐 访问验证</h1>
      <p class="lock-description">此导航站已启用访问保护</p>
      <form @submit.prevent="handleUnlock">
        <div class="form-group">
          <label for="unlock-password">请输入访问密钥:</label>
          <input
            id="unlock-password"
            type="password"
            v-model="unlockPassword"
            placeholder="请输入访问密钥"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="unlock-btn" :disabled="unlocking">
          {{ unlocking ? '验证中...' : '进入导航' }}
        </button>
      </form>
      <div v-if="unlockError" class="error-message">
        {{ unlockError }}
      </div>
    </div>
  </div>

  <!-- 正常导航界面 -->
  <div v-else class="nav-home">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- Logo区域 -->
      <div class="logo-section">
        <img src="/logo.png" alt="logo" class="logo" />
        <h1 class="site-title">{{ title || '猫猫导航' }}</h1>
      </div>

      <!-- 分类导航 -->
      <nav class="category-nav">
        <h2 class="nav-title">分类导航</h2>
        <ul class="category-list">
          <li
            v-for="category in visibleCategories"
            :key="category.id"
            class="category-item"
            @click="scrollToCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </li>
        </ul>
      </nav>

    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
                  <!-- 顶部搜索栏 -->
      <header class="search-header">
        <div class="search-container">
          <span class="search-icon">⌕</span>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索商家、服务、联系方式或地址"
            class="search-input"
          />
          <button v-if="searchQuery" class="clear-search-btn" @click="clearSearch" title="清空搜索">×</button>
        </div>

        <!-- 主题切换按钮 -->
        <button class="theme-toggle-btn" @click="themeStore.toggleTheme" :title="themeStore.isDarkMode ? '切换到日间模式' : '切换到夜间模式'">
          <svg v-if="!themeStore.isDarkMode" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
          </svg>
        </button>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 移动端分类菜单 -->
        <div class="mobile-menu" :class="{ active: showMobileMenu }">
          <div class="mobile-menu-header">
            <h3>分类导航</h3>
            <button class="close-btn" @click="closeMobileMenu">×</button>
          </div>
          <ul class="mobile-category-list">
            <li
              v-for="category in visibleCategories"
              :key="category.id"
              class="mobile-category-item"
              @click="scrollToCategoryMobile(category.id)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </li>
          </ul>
        </div>

        <!-- 移动端菜单遮罩 -->
        <div class="mobile-menu-overlay" :class="{ active: showMobileMenu }" @click="closeMobileMenu"></div>
      </header>

      <!-- 导航内容区 -->
      <div class="content-area">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchCategories" class="retry-btn">重试</button>
        </div>

        <!-- 分类内容 -->
        <div v-else class="categories-container">
          <div v-if="searchQuery" class="search-summary">
            找到 {{ visibleSiteCount }} 个相关商家
          </div>

          <div v-if="visibleCategories.length === 0" class="empty-search">
            <h2>没有找到相关商家</h2>
            <p>换个关键词试试，比如“超市”“签证”“@用户名”或“Colombo”。</p>
            <button class="retry-btn" @click="clearSearch">清空搜索</button>
          </div>

          <section
            v-for="category in visibleCategories"
            :key="category.id"
            class="category-section"
            :id="`category-${category.id}`"
          >
            <h2 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </h2>

            <div class="sites-grid">
              <article
                v-for="site in category.sites"
                :key="site.id"
                class="site-card"
              >
                <div class="site-media" :class="{ 'has-image': site.icon }">
                  <img v-if="site.icon" :src="site.icon" :alt="site.name" @error="handleImageError" />
                  <div class="site-placeholder">
                    <span class="placeholder-icon">{{ category.icon }}</span>
                    <strong>{{ getSiteInitial(site.name) }}</strong>
                  </div>
                </div>

                <div class="site-info">
                  <div class="site-badges">
                    <span class="category-pill">{{ category.name }}</span>
                    <span v-if="getSiteStatus(site)" class="status-pill">{{ getSiteStatus(site) }}</span>
                  </div>
                  <h3 class="site-name">{{ site.name }}</h3>
                  <p class="site-description">{{ formatDescription(site) }}</p>

                  <div class="site-meta">
                    <span v-if="getSiteContact(site)" class="meta-item">✈ {{ getSiteContact(site) }}</span>
                    <span v-if="getSitePhone(site)" class="meta-item">☎ {{ getSitePhone(site) }}</span>
                    <span v-if="getSiteHours(site)" class="meta-item">🕒 {{ getSiteHours(site) }}</span>
                    <span v-if="getSiteAddress(site)" class="meta-item address">📍 {{ getSiteAddress(site) }}</span>
                  </div>

                  <div class="site-actions">
                    <a
                      :href="getContactUrl(site)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-action-btn contact"
                    >
                      联系商家
                    </a>
                    <a
                      :href="getChannelUrl(site)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-action-btn channel"
                    >
                      查看频道
                    </a>
                    <a
                      :href="getUberUrl(site)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-action-btn uber"
                    >
                      Uber打车
                    </a>
                    <a
                      :href="getMapUrl(site)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="site-action-btn map"
                    >
                      谷歌地图
                    </a>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="featuredArticles.length" class="portal-section" id="articles">
            <h2 class="portal-title">📰 兰卡资讯</h2>
            <div class="portal-grid">
              <article v-for="item in featuredArticles" :key="item.id" class="portal-card">
                <div class="portal-cover" :class="{ 'has-image': item.image }">
                  <img v-if="item.image" :src="item.image" :alt="item.title" @error="handleImageError" />
                  <span v-else>📰</span>
                </div>
                <div class="portal-body">
                  <div class="portal-meta">
                    <span>{{ item.category || '资讯' }}</span>
                    <span v-if="item.pinned">置顶</span>
                    <span v-if="item.publishedAt">{{ item.publishedAt }}</span>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.summary }}</p>
                  <a v-if="item.link" :href="item.link" target="_blank" rel="noopener noreferrer" class="portal-link">查看详情</a>
                </div>
              </article>
            </div>
          </section>

          <section v-if="featuredGuides.length" class="portal-section" id="guides">
            <h2 class="portal-title">🧭 旅游指南</h2>
            <div class="portal-grid">
              <article v-for="item in featuredGuides" :key="item.id" class="portal-card">
                <div class="portal-cover guide" :class="{ 'has-image': item.image }">
                  <img v-if="item.image" :src="item.image" :alt="item.title" @error="handleImageError" />
                  <span v-else>🧭</span>
                </div>
                <div class="portal-body">
                  <div class="portal-meta">
                    <span>{{ item.category || item.location || '路线' }}</span>
                    <span v-if="item.duration">{{ item.duration }}</span>
                    <span v-if="item.budget">{{ item.budget }}</span>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.summary }}</p>
                  <div class="portal-actions">
                    <a v-if="item.mapUrl" :href="item.mapUrl" target="_blank" rel="noopener noreferrer" class="portal-link">地图路线</a>
                    <a v-if="item.contactUrl" :href="item.contactUrl" target="_blank" rel="noopener noreferrer" class="portal-link secondary">咨询</a>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="featuredJobs.length" class="portal-section" id="jobs">
            <h2 class="portal-title">💼 招聘求职</h2>
            <div class="portal-grid">
              <article v-for="item in featuredJobs" :key="item.id" class="portal-card job">
                <div class="portal-body">
                  <div class="portal-meta">
                    <span>{{ item.category || '招聘' }}</span>
                    <span v-if="item.expiresAt">有效期 {{ item.expiresAt }}</span>
                  </div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.summary || item.requirements }}</p>
                  <div class="job-meta">
                    <span v-if="item.company">{{ item.company }}</span>
                    <span v-if="item.location">{{ item.location }}</span>
                    <span v-if="item.salary">{{ item.salary }}</span>
                  </div>
                  <a v-if="item.contactUrl" :href="item.contactUrl" target="_blank" rel="noopener noreferrer" class="portal-link">联系招聘方</a>
                </div>
              </article>
            </div>
          </section>

          <!-- 页面底部信息 -->
          <footer class="page-footer">
            <div class="footer-content">
              <div class="footer-info">
                <h3>{{ title || 'lanka68.com' }}</h3>
                <p>斯里兰卡本地商家联系方式整理</p>
              </div>
            </div>

            <div class="footer-bottom">
              <p>&copy; {{ new Date().getFullYear() }} {{ title || 'lanka68.com' }}</p>
            </div>
          </footer>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useNavigation } from '@/apis/useNavigation.js'
import { useThemeStore } from '@/stores/counter.js'

// 使用导航API
const { categories, articles, guides, jobs, title, loading, error, fetchCategories } = useNavigation()

// 使用主题store
const themeStore = useThemeStore()

// 响应式数据
const searchQuery = ref('') // 搜索查询
const showMobileMenu = ref(false) // 移动端菜单显示状态

// 锁定功能相关
const isLocked = ref(false) // 是否启用锁定功能
const isUnlocked = ref(false) // 是否已解锁
const unlockPassword = ref('') // 解锁密码输入
const unlocking = ref(false) // 解锁中状态
const unlockError = ref('') // 解锁错误信息

// 自定义固定时间滚动函数
const smoothScrollTo = (container, targetTop, duration = 600) => {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  let startTime = null

  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)

    // 使用缓动函数 (easeInOutCubic)
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2

    container.scrollTop = startTop + distance * ease

    if (progress < 1) {
      requestAnimationFrame(animateScroll)
    }
  }

  requestAnimationFrame(animateScroll)
}

// 滚动到指定分类
const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  const container = document.querySelector('.content-area')

  if (element && container) {
    const elementOffsetTop = element.offsetTop

    // 使用固定时间滚动（600毫秒）
    smoothScrollTo(container, Math.max(0, elementOffsetTop), 600)
  }
}

// 检查是否启用锁定功能
const checkLockStatus = () => {
  const openLock = import.meta.env.VITE_OPEN_LOCK
  if (openLock && openLock.trim() !== '') {
    isLocked.value = true
    // 检查是否已经解锁过
    const savedUnlock = localStorage.getItem('nav_unlocked')
    if (savedUnlock === 'true') {
      isUnlocked.value = true
    }
  } else {
    isLocked.value = false
    isUnlocked.value = true // 如果没有启用锁定，默认为解锁状态
  }
}

// 处理解锁（通过服务端验证）
const handleUnlock = async () => {
  unlocking.value = true
  unlockError.value = ''

  try {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: unlockPassword.value }),
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || '访问密钥错误，请重新输入')
    }

    isUnlocked.value = true
    localStorage.setItem('nav_unlocked', 'true')
    unlockPassword.value = ''
  } catch (error) {
    unlockError.value = error.message
  } finally {
    unlocking.value = false
  }
}

const normalizeText = (value = '') => String(value)
  .replace(/\u00a0/g, ' ')
  .replace(/[ \t]+/g, ' ')
  .trim()

const getDescriptionLines = (site) => String(site.description || '')
  .split(/\n+/)
  .map((line) => normalizeText(line))
  .filter(Boolean)

const shortenText = (value, maxLength = 42) => {
  const text = normalizeText(value)
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const getSiteInitial = (name = '') => {
  const cleanName = normalizeText(name).replace(/[^\p{L}\p{N}]/gu, '')
  return cleanName.slice(0, 1).toUpperCase() || 'L'
}

const getSiteContact = (site) => {
  const text = `${site.description || ''} ${site.url || ''}`
  const matches = text.match(/@[A-Za-z0-9_]{4,}/g) || []
  if (matches.length) return matches[0]

  const telegramMatch = String(site.url || '').match(/t\.me\/([A-Za-z0-9_]{4,})/i)
  return telegramMatch ? `@${telegramMatch[1]}` : ''
}

const getSitePhone = (site) => {
  const text = normalizeText(site.description || '')
  const matches = text.match(/(?:\+94\s*)?(?:0\s*)?\d[\d\s-]{6,}\d/g) || []
  const phone = matches.find((match) => match.replace(/\D/g, '').length >= 8)
  return phone ? normalizeText(phone) : ''
}

const getLineValue = (site, patterns) => {
  const line = getDescriptionLines(site).find((item) => patterns.some((pattern) => pattern.test(item)))
  if (!line) return ''
  const [, value = ''] = line.split(/[:：]/)
  return shortenText(value || line.replace(/^(谷歌地址|谷歌定位|地址|定位|营业时间|状态)\s*/i, ''), 46)
}

const getFullLineValue = (site, patterns) => {
  const line = getDescriptionLines(site).find((item) => patterns.some((pattern) => pattern.test(item)))
  if (!line) return ''
  const [, value = ''] = line.split(/[:：]/)
  return normalizeText(value || line.replace(/^(谷歌地址|谷歌定位|地址|定位|营业时间|状态)\s*/i, ''))
}

const getSiteAddress = (site) => getLineValue(site, [/谷歌地址/i, /谷歌定位/i, /^地址/i, /定位/i])

const getFullSiteAddress = (site) => getFullLineValue(site, [/谷歌地址/i, /谷歌定位/i, /^地址/i, /定位/i])

const getSiteHours = (site) => getLineValue(site, [/营业时间/i])

const getSiteStatus = (site) => getLineValue(site, [/状态/i])

const getLocationQuery = (site) => getFullSiteAddress(site) || normalizeText(site.name || '')

const getContactUrl = (site) => site.contactUrl || site.url || '#'

const getChannelUrl = (site) => site.channelUrl || site.url || getContactUrl(site)

const getMapUrl = (site) => {
  if (site.mapUrl) return site.mapUrl
  const query = getLocationQuery(site)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

const getUberUrl = (site) => {
  if (site.uberUrl) return site.uberUrl
  const query = getLocationQuery(site)
  return `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(query)}`
}

const formatDescription = (site) => {
  const cleanedLines = getDescriptionLines(site).filter((line) => {
    if (/^(联系方式|联系飞机|谷歌地址|谷歌定位|地址|定位|电话|telegram|飞机|微信|WA|营业时间|状态|商家入驻|兰卡生活)\s*[:：]?/i.test(line)) return false
    if (/^@[\w_]+$/.test(line)) return false
    if (/^https?:\/\//i.test(line)) return false
    return true
  })

  return normalizeText(cleanedLines.join(' · ')) || '暂无详细介绍，建议直接联系商家确认服务内容。'
}

const getSearchText = (category, site) => [
  category.name,
  category.icon,
  site.name,
  site.description,
  site.url,
  site.contactUrl,
  site.channelUrl,
  site.uberUrl,
  site.mapUrl,
  getSiteContact(site),
  getSitePhone(site),
  getSiteAddress(site),
  getSiteHours(site),
].join(' ').toLowerCase()

const visibleCategories = computed(() => {
  const query = normalizeText(searchQuery.value).toLowerCase()
  if (!query) return categories.value

  return categories.value
    .map((category) => {
      const categorySites = category.sites || []
      const categoryMatches = `${category.name} ${category.icon}`.toLowerCase().includes(query)
      const sites = categoryMatches
        ? categorySites
        : categorySites.filter((site) => getSearchText(category, site).includes(query))

      return {
        ...category,
        sites,
      }
    })
    .filter((category) => category.sites.length > 0)
})

const visibleSiteCount = computed(() => visibleCategories.value.reduce((total, category) => total + category.sites.length, 0))

const sortPinnedFirst = (items) => [...(items.value || [])].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))

const featuredArticles = computed(() => sortPinnedFirst(articles).slice(0, 6))

const featuredGuides = computed(() => sortPinnedFirst(guides).slice(0, 6))

const featuredJobs = computed(() => sortPinnedFirst(jobs).slice(0, 6))

const clearSearch = () => {
  searchQuery.value = ''
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.closest('.site-media')?.classList.add('image-error')
  event.target.closest('.portal-cover')?.classList.add('image-error')
  event.target.removeAttribute('src')
  event.target.onerror = null
}

// 移动端菜单控制
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  // 控制body滚动
  if (showMobileMenu.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  // 恢复body滚动
  document.body.style.overflow = ''
}

// 移动端分类滚动
const scrollToCategoryMobile = (categoryId) => {
  closeMobileMenu() // 先关闭菜单

  // 稍微延迟一下再滚动，确保菜单关闭动画完成
  setTimeout(() => {
    scrollToCategory(categoryId)
  }, 200)
}

// 组件挂载时获取数据
onMounted(async () => {
  checkLockStatus() // 检查锁定状态
  await fetchCategories()
})

// 组件卸载时清理样式
onUnmounted(() => {
  // 确保卸载时恢复body滚动
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* 锁定界面样式 */
.lock-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2c3e50;
  padding: 20px;
  z-index: 9999;
}

.lock-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.lock-box h1 {
  color: #2d3748;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: 600;
}

.lock-description {
  color: #718096;
  margin-bottom: 30px;
  font-size: 16px;
}

.lock-box .form-group {
  margin-bottom: 20px;
  text-align: left;
}

.lock-box .form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
  font-size: 14px;
}

.lock-box .form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #fff;
}

.lock-box .form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.unlock-btn {
  width: 100%;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.unlock-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.unlock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.lock-box .error-message {
  margin-top: 15px;
  padding: 12px;
  background: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid #feb2b2;
}

.nav-home {
  display: flex;
  min-height: 100vh;
  background: #f7f4ef;
}

/* 左侧边栏样式 */
.sidebar {
  width: 280px;
  background: #243b36;
  color: white;
  padding: 0;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100vh;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  padding-left: 20px;
  padding-top: 13px;
  padding-bottom: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 55px;
  height: 55px;
  border-radius: 12px;
  margin-right: 15px;
}

.site-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.category-nav {
  padding: 20px 0;
  height: calc(100vh - 82px);
  overflow-y: auto;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 20px 15px;
  color: #bdc3c7;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.category-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  box-shadow: inset 4px 0 0 #f0b35a;
}

.category-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.category-name {
  font-size: 15px;
  font-weight: 500;
}

/* 右侧主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.search-header {
  background: rgba(255, 255, 255, 0.92);
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-container {
  display: flex;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex: 1;
  background: white;
}

@media (max-width: 768px) {
  .search-container {
    margin: 0;
    max-width: none;
  }
}

.search-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: #31514a;
  font-size: 22px;
  border-right: 1px solid #eee4d6;
}

.search-input {
  flex: 1;
  border: none;
  padding: 12px 16px;
  font-size: 16px;
  outline: none;
  background: white;
  min-width: 0;
}

.search-input::placeholder {
  color: #95a5a6;
}

.clear-search-btn {
  width: 38px;
  height: 38px;
  margin-right: 4px;
  border: none;
  background: transparent;
  color: #687872;
  cursor: pointer;
  border-radius: 6px;
  font-size: 22px;
  line-height: 1;
}

.clear-search-btn:hover {
  background: #f1ece4;
  color: #243b36;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.mobile-menu-btn:hover {
  background: #f8f9fa;
}

/* 移动端菜单 */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 240px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: right 0.3s ease;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.mobile-menu.active {
  right: 0;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e9ecef;
  background: #2c3e50;
  color: white;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.mobile-category-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 160px; /* 增加底部内边距确保最后一项完全可见 */
}

.mobile-category-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f8f9fa;
}

.mobile-category-item:hover {
  background: #f8f9fa;
}

.mobile-category-item .category-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.mobile-category-item .category-name {
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}



/* 移动端菜单遮罩 */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.mobile-menu-overlay.active {
  opacity: 1;
  visibility: visible;
}

/* 内容区域样式 */
.content-area {
  flex: 1;
  padding: 0 30px 90px;
  padding-bottom: 90px;
  overflow-y: auto;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #7f8c8d;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ecf0f1;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.categories-container {
  max-width: 1320px;
  margin: 0 auto;
}

.category-section {
  margin-bottom: 50px;
}

.category-title {
  position: sticky;
  top: 0;
  z-index: 30;
  font-size: 30px;
  font-weight: 600;
  margin: 0 0 25px 0;
  padding: 14px 0;
  color: #243b36;
  display: flex;
  align-items: center;
  background: #f7f4ef;
  border-bottom: 1px solid rgba(228, 221, 209, 0.9);
}

.category-title .category-icon {
  font-size: 32px;
  margin-right: 16px;
}

.category-title .category-name {
  margin-left: 10px;
  font-size: 26px;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 18px;
}

.search-summary {
  margin: 0 0 20px;
  padding: 10px 12px;
  border: 1px solid #e4ddd1;
  border-radius: 8px;
  background: #fff;
  color: #5f6f69;
  font-size: 14px;
  font-weight: 600;
}

.empty-search {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: #5f6f69;
}

.empty-search h2 {
  margin: 0;
  color: #243b36;
  font-size: 24px;
}

.empty-search p {
  margin: 0 0 8px;
  font-size: 14px;
}

.site-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  padding: 0;
  color: inherit;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  border: 1px solid #e4ddd1;
  position: relative;
  overflow: hidden;
  min-height: 360px;
}

.site-card::before {
  display: none;
}

.site-card:hover {
  transform: translateY(-2px);
  border-color: #d9c6a6;
  box-shadow: 0 14px 36px rgba(61, 48, 33, 0.12);
}

.site-media {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #e7f0e5 0%, #f8eddc 100%);
  border-bottom: 1px solid #eee4d6;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.site-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  inset: 0;
  z-index: 2;
}

.site-media.has-image:not(.image-error) .site-placeholder {
  opacity: 0;
}

.site-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #31514a;
}

.placeholder-icon {
  font-size: 34px;
}

.site-placeholder strong {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
  color: #243b36;
  font-size: 20px;
}

.site-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 16px;
  position: relative;
}

.site-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.category-pill,
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
}

.category-pill {
  background: #edf5f1;
  color: #31514a;
}

.status-pill {
  background: #fff4de;
  color: #8a5b12;
}

.site-name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #243b36;
  line-height: 1.35;
}

.site-description {
  font-size: 14px;
  color: #5f6f69;
  margin: 0;
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.site-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.meta-item {
  max-width: 100%;
  padding: 7px 9px;
  border-radius: 6px;
  background: #f7f4ef;
  color: #43534f;
  font-size: 12px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-item.address {
  flex-basis: 100%;
}

.site-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
}

.site-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 9px 10px;
  border-radius: 6px;
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  transition: background 0.2s ease, transform 0.2s ease;
  text-align: center;
  white-space: nowrap;
}

.site-action-btn:hover {
  transform: translateY(-1px);
}

.site-action-btn.contact {
  background: #d26f3d;
}

.site-action-btn.contact:hover {
  background: #b95d31;
}

.site-action-btn.channel {
  background: #31514a;
}

.site-action-btn.channel:hover {
  background: #243b36;
}

.site-action-btn.uber {
  background: #111827;
}

.site-action-btn.uber:hover {
  background: #000;
}

.site-action-btn.map {
  background: #2f7d5f;
}

.site-action-btn.map:hover {
  background: #236148;
}

.portal-section {
  margin: 54px 0 0;
}

.portal-title {
  margin: 0 0 18px;
  color: #243b36;
  font-size: 26px;
  font-weight: 700;
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.portal-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e4ddd1;
  border-radius: 8px;
  background: #fff;
}

.portal-card.job {
  min-height: 220px;
}

.portal-cover {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 16 / 8;
  overflow: hidden;
  background: linear-gradient(135deg, #e7f0e5 0%, #f8eddc 100%);
  color: #31514a;
  font-size: 36px;
}

.portal-cover.guide {
  background: linear-gradient(135deg, #e8f0fb 0%, #ecf6ed 100%);
}

.portal-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portal-cover.image-error {
  background: linear-gradient(135deg, #e7f0e5 0%, #f8eddc 100%);
}

.portal-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 16px;
}

.portal-meta,
.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.portal-meta span,
.job-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #edf5f1;
  color: #31514a;
  font-size: 12px;
  font-weight: 700;
}

.job-meta span {
  background: #f7f4ef;
  color: #43534f;
}

.portal-body h3 {
  margin: 0 0 8px;
  color: #243b36;
  font-size: 18px;
  line-height: 1.35;
}

.portal-body p {
  margin: 0 0 14px;
  color: #5f6f69;
  font-size: 14px;
  line-height: 1.6;
}

.portal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.portal-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 36px;
  margin-top: auto;
  padding: 8px 13px;
  border-radius: 6px;
  background: #31514a;
  color: white;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}

.portal-link.secondary {
  background: #d26f3d;
}

/* 页面底部 */
.page-footer {
  margin-top: 60px;
  padding: 28px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4ddd1;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 30px;
}

.footer-info h3 {
  color: #243b36;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.footer-info p {
  color: #6b756f;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.footer-links {
  display: flex;
  gap: 15px;
}

.footer-link {
  display: flex;
  align-items: center;
  color: #3498db;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  background: white;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.footer-link:hover {
  background: #3498db;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.footer-link svg {
  margin-right: 6px;
  transition: transform 0.3s ease;
}

.footer-link:hover svg {
  transform: scale(1.1);
}

.footer-bottom {
  border-top: 1px solid #eee4d6;
  padding-top: 14px;
  text-align: center;
}

.footer-bottom p {
  color: #7c827e;
  font-size: 13px;
  margin: 5px 0;
  line-height: 1.4;
}

.footer-bottom a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.footer-bottom a:hover {
  color: #2980b9;
  text-decoration: underline;
}

.footer-tech {
  font-size: 12px !important;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-home {
    flex-direction: column;
    height: 100vh;
    height: 100svh; /* 使用动态视口高度 */
    overflow: hidden;
  }

  .sidebar {
    display: none; /* 在移动端隐藏左侧边栏 */
  }

  .main-content {
    flex: 1;
    height: 100vh;
    height: 100svh; /* 使用动态视口高度，更准确 */
    margin-left: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .search-header {
    padding: 15px 20px;
    position: relative;
    flex-shrink: 0;
    z-index: 500;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .content-area {
    flex: 1;
    padding: 0 15px 90px;
    padding-bottom: 90px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
  }

  .mobile-menu-btn {
    display: block; /* 在移动端显示菜单按钮 */
    flex-shrink: 0;
  }

  .sites-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .portal-grid {
    grid-template-columns: 1fr;
  }

  .portal-section {
    margin-top: 40px;
  }

  .portal-title {
    font-size: 22px;
  }

  .site-card {
    min-height: auto;
  }

  .site-media {
    aspect-ratio: 2 / 1;
  }

  .site-card .site-name {
    font-size: 17px;
  }

  .site-card .site-description {
    font-size: 13px;
  }

  .category-title {
    top: 0;
    font-size: 24px;
    margin-bottom: 20px;
    padding: 12px 0;
  }

  .category-title .category-icon {
    font-size: 28px;
    margin-right: 12px;
  }

  .category-title .category-name {
    font-size: 22px;
  }

  /* 移动端页面底部 */
  .page-footer {
    margin-top: 40px;
    padding: 30px 20px;
  }

  .footer-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .footer-links {
    justify-content: center;
  }

  .footer-bottom {
    padding-top: 15px;
  }

  .footer-bottom p {
    font-size: 12px;
  }
}

/* 主题切换按钮样式 */
.theme-toggle-btn {
  background: none;
  border: none;
  color: #2c3e50;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.theme-toggle-btn:hover {
  background: #f8f9fa;
  transform: scale(1.1);
}

/* 暗色模式样式 */
.dark .nav-home {
  background: #171d1b;
}

.dark .sidebar {
  background: #172824;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
}

.dark .search-header {
  background: #1e293b;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.dark .theme-toggle-btn {
  color: #e2e8f0;
}

.dark .theme-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dark .mobile-menu-btn {
  color: #e2e8f0;
}

.dark .mobile-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dark .search-container {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  background: #374151;
}

.dark .search-icon {
  color: #bfe0d1;
  border-right: 1px solid #4b5563;
}

.dark .search-input {
  background: #374151;
  color: #e2e8f0;
  border: none;
}

.dark .search-input::placeholder {
  color: #9ca3af;
}

.dark .clear-search-btn {
  color: #cbd5e1;
}

.dark .clear-search-btn:hover {
  background: #4b5563;
  color: #f8fafc;
}

.dark .content-area {
  background: #171d1b;
}

.dark .site-card {
  background: #22302c;
  border: 1px solid #34433f;
  color: #e2e8f0;
}

.dark .site-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
}

.dark .site-name {
  color: #f1f5f3;
}

.dark .site-description {
  color: #b8c5bf;
}

.dark .site-media {
  background: linear-gradient(135deg, #263d37 0%, #4d3d2a 100%);
  border-bottom: 1px solid #34433f;
}

.dark .site-placeholder {
  color: #c9d8d1;
}

.dark .site-placeholder strong {
  background: rgba(255, 255, 255, 0.12);
  color: #f1f5f3;
}

.dark .category-pill {
  background: rgba(130, 177, 154, 0.16);
  color: #bfe0d1;
}

.dark .status-pill {
  background: rgba(240, 179, 90, 0.16);
  color: #f2c783;
}

.dark .meta-item {
  background: #1b2623;
  color: #c5d1cc;
}

.dark .site-action-btn.contact {
  background: #c76739;
}

.dark .site-action-btn.contact:hover {
  background: #df7a49;
}

.dark .site-action-btn.channel {
  background: #3f645b;
}

.dark .site-action-btn.channel:hover {
  background: #4f7d71;
}

.dark .site-action-btn.uber {
  background: #030712;
}

.dark .site-action-btn.uber:hover {
  background: #111827;
}

.dark .site-action-btn.map {
  background: #2f7d5f;
}

.dark .site-action-btn.map:hover {
  background: #3d936f;
}

.dark .category-title {
  color: #f1f5f3;
  background: #171d1b;
  border-bottom: 1px solid #34433f;
}

.dark .search-summary {
  background: #22302c;
  border-color: #34433f;
  color: #c5d1cc;
}

.dark .empty-search {
  color: #c5d1cc;
}

.dark .empty-search h2 {
  color: #f1f5f3;
}

.dark .portal-title {
  color: #f1f5f3;
}

.dark .portal-card {
  background: #22302c;
  border-color: #34433f;
}

.dark .portal-cover {
  background: linear-gradient(135deg, #263d37 0%, #4d3d2a 100%);
  color: #c9d8d1;
}

.dark .portal-cover.guide {
  background: linear-gradient(135deg, #20364a 0%, #263d37 100%);
}

.dark .portal-body h3 {
  color: #f1f5f3;
}

.dark .portal-body p {
  color: #b8c5bf;
}

.dark .portal-meta span {
  background: rgba(130, 177, 154, 0.16);
  color: #bfe0d1;
}

.dark .job-meta span {
  background: #1b2623;
  color: #c5d1cc;
}

.dark .portal-link {
  background: #3f645b;
}

.dark .portal-link.secondary {
  background: #c76739;
}

.dark .mobile-menu {
  background: #1e293b;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
}

.dark .mobile-category-item {
  border-bottom: 1px solid #374151;
}

.dark .mobile-category-item:hover {
  background: #374151;
}

.dark .mobile-category-item .category-name {
  color: #e2e8f0;
}

.dark .page-footer {
  background: #22302c;
  border: 1px solid #34433f;
}

.dark .footer-info h3 {
  color: #e2e8f0;
}

.dark .footer-info p {
  color: #9ca3af;
}

.dark .footer-bottom p {
  color: #9ca3af;
}

.dark .footer-bottom a {
  color: #3b82f6;
}

.dark .footer-bottom a:hover {
  color: #60a5fa;
}

.dark .loading,
.dark .error {
  color: #9ca3af;
}

.dark .retry-btn {
  background: #3b82f6;
  color: white;
}

.dark .retry-btn:hover {
  background: #2563eb;
}

/* 锁定界面暗色模式 */
.dark .lock-container {
  background: #0f172a;
}

.dark .lock-box {
  background: #1e293b;
  color: #e2e8f0;
}

.dark .lock-box h1 {
  color: #e2e8f0;
}

.dark .lock-description {
  color: #94a3b8;
}

.dark .lock-box .form-group label {
  color: #cbd5e1;
}

.dark .lock-box .form-input {
  background: #374151;
  border: 2px solid #4b5563;
  color: #e2e8f0;
}

.dark .lock-box .form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .unlock-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.dark .unlock-btn:hover:not(:disabled) {
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
}
</style>
