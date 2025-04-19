<template>
  <div style="max-width: 600px; margin: auto; padding: 1rem">
    <h2>GPT-базований RAG Бот</h2>
    <textarea v-model="question" placeholder="Введіть питання..." rows="4" class="tw-w-full"></textarea>
    <button @click="send" :disabled="loading">Надіслати</button>

    <div v-if="loading">Чекаємо на відповідь...</div>
    <div v-if="reply" style="margin-top: 1rem">
      <strong>Відповідь:</strong>
      <p>{{ reply }}</p>
    </div>
  </div>

  <PdfUploader />
</template>

<script setup>
import { ref } from 'vue'
import PdfUploader from "./components/PdfUploader.vue";

const question = ref('')
const reply = ref('')
const loading = ref(false)

const send = async () => {
  loading.value = true
  reply.value = ''
  const res = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: question.value,
      sessionId: localStorage.getItem('sessionId')
    })
  })

  const data = await res.json()
  reply.value = data.reply
  loading.value = false
}
</script>
