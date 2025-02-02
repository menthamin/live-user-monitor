<!-- views/SellerPage.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { v4 as uuidv4 } from 'uuid';

const route = useRoute();
const sellerId = route.params.sellerId;

onMounted(() => {
  let sessionId = localStorage.getItem('session_id');
  
  // UUID 기반 세션 ID 발급
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('session_id', sessionId);
  }

  // 서버에 접속 정보 전달
  fetch('http://localhost:3000/track-active-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerId, sessionId }),
  });
});
</script>

<template>
  <div>
    <h2>Welcome to {{ sellerId }}'s Shop</h2>
    <p>Tracking your visit...</p>
  </div>
</template>