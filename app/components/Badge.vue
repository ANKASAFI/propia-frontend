<script setup lang="ts">
const props = defineProps<{ label: string; cls?: string; icon?: string }>()
const icons: Record<string, string> = {
  'Borrador': 'pen', 'En fondeo': 'clock', 'Fondeada': 'check', 'En notaría': 'landmark', 'Inscrita': 'file',
  'En operación': 'building', 'Cancelada': 'x', 'En votación': 'users', 'En venta': 'trend', 'Vendida': 'check',
  'En evaluación': 'shield', 'Por validar': 'clock', 'Aprobado': 'check', 'Rechazado': 'x', 'Rechazada': 'x',
  'Ventana interna': 'clock', 'En retracto': 'history', 'Abierta': 'check', 'Tu oferta': 'user',
  'Solicitud pendiente': 'clock', 'Habilitado': 'check', 'Alto': 'alert', 'Medio': 'clock', 'Bajo': 'check',
  'Observada': 'alert', 'Por firmar': 'pen', 'En habilitación': 'pen',
}
const name = computed(() => props.icon || icons[props.label] || 'info')
</script>
<template>
  <span class="badge has-ico" :class="cls || 'b-gray'"><Icon :name="name" />{{ label }}</span>
</template>
