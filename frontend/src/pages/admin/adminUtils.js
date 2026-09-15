export function getStatusLabel(status) {
  const labels = {
    pending: 'รอดำเนินการ',
    preparing: 'กำลังเตรียม',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก'
  }
  return labels[status] || status
}

export function getStatusClass(status) {
  const classes = {
    pending: 'bg-[#FEF3E2] text-[#E67E22]',
    preparing: 'bg-[#EBF5FB] text-[#3498DB]',
    completed: 'bg-[#EAFAF1] text-[#2ECC71]',
    cancelled: 'bg-[#FDEDEC] text-[#E74C3C]'
  }
  return classes[status] || ''
}

export function getStatusDotColor(status) {
  const colors = {
    pending: '#E67E22',
    preparing: '#3498DB',
    completed: '#2ECC71',
    cancelled: '#E74C3C'
  }
  return colors[status] || '#6b5240'
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
