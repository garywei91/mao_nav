<template>
  <div class="content-manager">
    <div class="manager-header">
      <div>
        <h2>{{ config.icon }} {{ config.title }}</h2>
        <p>{{ config.description }}</p>
      </div>
      <div class="header-actions">
        <button @click="openAddModal" class="add-btn">添加{{ config.itemName }}</button>
        <button @click="emitSave" :disabled="loading" class="save-btn">
          {{ loading ? '保存中...' : '保存到GitHub' }}
        </button>
      </div>
    </div>

    <div class="content-list">
      <article v-for="item in localItems" :key="item.id" class="content-item">
        <div class="item-main">
          <div class="item-topline">
            <span class="item-category">{{ item.category || config.itemName }}</span>
            <span v-if="item.pinned" class="pin-badge">置顶</span>
            <span v-if="type === 'jobs' && item.expiresAt" class="muted">有效期 {{ item.expiresAt }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary || item.content || item.requirements }}</p>
          <div class="item-meta">
            <span v-if="item.company">{{ item.company }}</span>
            <span v-if="item.location">{{ item.location }}</span>
            <span v-if="item.salary">{{ item.salary }}</span>
            <span v-if="item.budget">{{ item.budget }}</span>
            <span v-if="item.duration">{{ item.duration }}</span>
          </div>
        </div>
        <div class="item-actions">
          <button @click="editItem(item)" class="edit-btn">编辑</button>
          <button @click="deleteItem(item)" class="delete-btn">删除</button>
        </div>
      </article>

      <div v-if="localItems.length === 0" class="empty-state">
        暂无{{ config.itemName }}，可以先添加一条内容。
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingItem ? '编辑' : '添加' }}{{ config.itemName }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>

        <form @submit.prevent="saveItem" class="content-form">
          <div class="form-row">
            <div class="form-group">
              <label>标题 *</label>
              <input v-model="formData.title" required class="form-input" placeholder="请输入标题">
            </div>
            <div class="form-group">
              <label>分类/标签</label>
              <input v-model="formData.category" class="form-input" :placeholder="config.categoryPlaceholder">
            </div>
          </div>

          <div v-if="type === 'jobs'" class="form-row">
            <div class="form-group">
              <label>公司/商家</label>
              <input v-model="formData.company" class="form-input" placeholder="公司或商家名称">
            </div>
            <div class="form-group">
              <label>薪资</label>
              <input v-model="formData.salary" class="form-input" placeholder="例如：面议 / 200,000 LKR">
            </div>
          </div>

          <div v-if="type === 'guides'" class="form-row">
            <div class="form-group">
              <label>预算</label>
              <input v-model="formData.budget" class="form-input" placeholder="例如：约 10,000 LKR">
            </div>
            <div class="form-group">
              <label>时长</label>
              <input v-model="formData.duration" class="form-input" placeholder="例如：半天 / 1天 / 3天">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>地点</label>
              <input v-model="formData.location" class="form-input" placeholder="例如：Colombo / Kandy">
            </div>
            <div class="form-group">
              <label>{{ type === 'jobs' ? '有效期' : '发布时间' }}</label>
              <input
                v-model="dateValue"
                type="date"
                class="form-input"
              >
            </div>
          </div>

          <div class="form-group">
            <label>摘要 *</label>
            <textarea v-model="formData.summary" required class="form-textarea" rows="3" placeholder="列表中显示的短介绍"></textarea>
          </div>

          <div class="form-group">
            <label>{{ type === 'jobs' ? '岗位要求/说明' : '正文内容' }}</label>
            <textarea v-model="mainText" class="form-textarea" rows="5" placeholder="填写详细内容"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>封面图</label>
              <div class="image-upload-row">
                <input
                  ref="imageFileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="image-file-input"
                  @change="uploadCoverImage"
                >
                <span class="upload-hint">支持 JPG、PNG、WebP、GIF，最大 5MB</span>
              </div>
              <div v-if="imageUploading" class="upload-status">图片上传中，请稍候…</div>
              <div v-else-if="formData.image" class="image-status">
                <img :src="imagePreview || formData.image" alt="封面预览" class="cover-preview">
                <span>已设置封面</span>
                <button type="button" class="remove-image-btn" @click="removeCoverImage">移除</button>
              </div>
              <input v-model="formData.image" type="url" class="form-input image-url-input" placeholder="也可粘贴 https:// 图片链接">
            </div>
            <div class="form-group">
              <label>{{ type === 'guides' ? '地图链接' : '详情链接' }}</label>
              <input v-model="primaryLink" type="url" class="form-input" placeholder="https://...">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>联系方式链接</label>
              <input v-model="formData.contactUrl" type="url" class="form-input" placeholder="https://t.me/...">
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input v-model="formData.pinned" type="checkbox">
                置顶显示
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">{{ editingItem ? '更新' : '添加' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGitHubAPI } from '../../apis/useGitHubAPI.js'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'save'])

const configs = {
  articles: {
    icon: '📰',
    title: '资讯管理',
    itemName: '资讯',
    description: '发布兰卡本地新闻、政策提醒、安全提示和生活资讯。',
    categoryPlaceholder: '例如：签证 / 安全 / 生活'
  },
  guides: {
    icon: '🧭',
    title: '旅游指南',
    itemName: '指南',
    description: '维护路线、景点、预算、地图和地接/司机推荐信息。',
    categoryPlaceholder: '例如：科伦坡 / 康提 / 加勒'
  },
  jobs: {
    icon: '💼',
    title: '招聘求职',
    itemName: '招聘',
    description: '发布本地岗位、兼职、求职信息和招聘方联系方式。',
    categoryPlaceholder: '例如：客服 / 翻译 / 兼职'
  }
}

const config = computed(() => configs[props.type] || configs.articles)
const localItems = ref([])
const showModal = ref(false)
const editingItem = ref(null)
const imageFileInput = ref(null)
const imageUploading = ref(false)
const imagePreview = ref('')
const { uploadBinaryFile } = useGitHubAPI()

const getEmptyForm = () => ({
  title: '',
  category: '',
  summary: '',
  content: '',
  requirements: '',
  image: '',
  link: '',
  contactUrl: '',
  mapUrl: '',
  company: '',
  salary: '',
  location: '',
  budget: '',
  duration: '',
  publishedAt: new Date().toISOString().slice(0, 10),
  expiresAt: '',
  pinned: false
})

const formData = ref(getEmptyForm())

watch(() => props.items, (items) => {
  localItems.value = JSON.parse(JSON.stringify(items || []))
}, { immediate: true, deep: true })

const dateValue = computed({
  get() {
    return props.type === 'jobs' ? formData.value.expiresAt : formData.value.publishedAt
  },
  set(value) {
    if (props.type === 'jobs') {
      formData.value.expiresAt = value
    } else {
      formData.value.publishedAt = value
    }
  }
})

const mainText = computed({
  get() {
    return props.type === 'jobs' ? formData.value.requirements : formData.value.content
  },
  set(value) {
    if (props.type === 'jobs') {
      formData.value.requirements = value
    } else {
      formData.value.content = value
    }
  }
})

const primaryLink = computed({
  get() {
    return props.type === 'guides' ? formData.value.mapUrl : formData.value.link
  },
  set(value) {
    if (props.type === 'guides') {
      formData.value.mapUrl = value
    } else {
      formData.value.link = value
    }
  }
})

const syncToParent = () => {
  emit('update', localItems.value)
}

const openAddModal = () => {
  editingItem.value = null
  formData.value = getEmptyForm()
  imagePreview.value = ''
  showModal.value = true
}

const editItem = (item) => {
  editingItem.value = item
  formData.value = {
    ...getEmptyForm(),
    ...JSON.parse(JSON.stringify(item))
  }
  imagePreview.value = ''
  showModal.value = true
}

const uploadCoverImage = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
    alert('请选择 JPG、PNG、WebP 或 GIF 图片。')
    event.target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('图片不能超过 5MB。')
    event.target.value = ''
    return
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg'
  const path = `public/uploads/content/${props.type}-${Date.now()}.${safeExtension}`

  imageUploading.value = true
  try {
    await uploadBinaryFile(path, await file.arrayBuffer(), `chore: 上传${config.value.itemName}封面图`)
    formData.value.image = `/uploads/content/${path.split('/').pop()}`
    imagePreview.value = URL.createObjectURL(file)
  } catch (error) {
    console.error('封面图上传失败:', error)
    alert(`图片上传失败：${error.message || '请稍后重试'}`)
  } finally {
    imageUploading.value = false
    event.target.value = ''
  }
}

const removeCoverImage = () => {
  formData.value.image = ''
  imagePreview.value = ''
  if (imageFileInput.value) imageFileInput.value.value = ''
}

const deleteItem = (item) => {
  if (!confirm(`确定要删除"${item.title}"吗？`)) return
  localItems.value = localItems.value.filter((entry) => entry.id !== item.id)
  syncToParent()
}

const saveItem = () => {
  const savedItem = {
    ...formData.value,
    id: editingItem.value?.id || `${props.type}-${Date.now()}`
  }

  if (editingItem.value) {
    const index = localItems.value.findIndex((entry) => entry.id === editingItem.value.id)
    if (index !== -1) {
      localItems.value[index] = savedItem
    }
  } else {
    localItems.value.unshift(savedItem)
  }

  syncToParent()
  closeModal()
}

const closeModal = () => {
  showModal.value = false
  editingItem.value = null
  formData.value = getEmptyForm()
  imagePreview.value = ''
}

const emitSave = () => {
  emit('save')
}
</script>

<style scoped>
.content-manager {
  padding: 20px 0;
}

.manager-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 20px;
  margin-bottom: 22px;
  border-bottom: 2px solid #e9ecef;
}

.manager-header h2 {
  margin: 0 0 6px;
  color: #2c3e50;
}

.manager-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.add-btn,
.save-btn,
.edit-btn,
.delete-btn,
.cancel-btn,
.submit-btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.add-btn,
.save-btn {
  padding: 10px 16px;
  color: white;
}

.add-btn {
  background: #27ae60;
}

.save-btn {
  background: #3498db;
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.content-list {
  display: grid;
  gap: 14px;
}

.content-item {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.item-main {
  min-width: 0;
}

.item-topline,
.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.item-category,
.pin-badge,
.item-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.item-category {
  background: #e8f5e8;
  color: #2d6a4f;
}

.pin-badge {
  background: #fff4de;
  color: #8a5b12;
}

.item-meta span {
  background: #eef2f7;
  color: #475569;
}

.muted {
  color: #6b7280;
  font-size: 12px;
}

.content-item h3 {
  margin: 10px 0 6px;
  color: #2c3e50;
}

.content-item p {
  margin: 0 0 10px;
  color: #64748b;
  line-height: 1.5;
}

.item-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

.edit-btn,
.delete-btn {
  padding: 8px 12px;
  color: white;
}

.edit-btn {
  background: #3498db;
}

.delete-btn {
  background: #e74c3c;
}

.empty-state {
  padding: 40px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 10px;
  background: white;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  color: #334155;
  font-size: 20px;
}

.content-form {
  padding: 22px;
}

.image-upload-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.image-file-input {
  max-width: 100%;
  font-size: 13px;
}

.upload-hint,
.upload-status {
  color: #64748b;
  font-size: 12px;
}

.upload-status {
  margin: 6px 0;
  color: #2563eb;
}

.image-status {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 8px 0;
  color: #166534;
  font-size: 13px;
}

.cover-preview {
  width: 44px;
  height: 44px;
  border: 1px solid #dbe4ee;
  border-radius: 8px;
  object-fit: cover;
}

.remove-image-btn {
  border: none;
  border-radius: 5px;
  padding: 5px 8px;
  color: #b91c1c;
  background: #fef2f2;
  cursor: pointer;
  font-size: 12px;
}

.image-url-input {
  margin-top: 5px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-weight: 600;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  font: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  align-items: end;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 18px;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.submit-btn {
  background: #27ae60;
  color: white;
}

@media (max-width: 768px) {
  .manager-header,
  .content-item {
    flex-direction: column;
  }

  .header-actions,
  .item-actions {
    width: 100%;
  }

  .header-actions button,
  .item-actions button {
    flex: 1;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
