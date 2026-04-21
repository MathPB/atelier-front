export interface ColorInfo {
  label: string
  fill: string
  border: string
}

export const COLOR_MAP: Record<string, ColorInfo> = {
  branco:           { label: 'Branco',         fill: '#FFFFFF', border: '#DCDCDC' },
  'off-white':      { label: 'Off White',       fill: '#EBEBEB', border: '#CFCFCF' },
  marfim:           { label: 'Marfim',          fill: '#FFFFF0', border: '#D8D8C0' },
  creme:            { label: 'Creme',           fill: '#FFFDD0', border: '#E0DBA0' },
  nude:             { label: 'Nude',            fill: '#E8C9A0', border: '#D4A574' },
  bege:             { label: 'Bege',            fill: '#F5F0E8', border: '#D9C8B4' },
  prata:            { label: 'Prata',           fill: '#CFCFCF', border: '#AFAFAF' },
  cinza:            { label: 'Cinza',           fill: '#909090', border: '#909090' },
  preto:            { label: 'Preto',           fill: '#1A1A1A', border: '#1A1A1A' },
  azul:             { label: 'Azul',            fill: '#002FFF', border: '#002FFF' },
  'azul-marinho':   { label: 'Azul Marinho',    fill: '#001F5B', border: '#001F5B' },
  verde:            { label: 'Verde',           fill: '#2D9D5E', border: '#2D9D5E' },
  vermelho:         { label: 'Vermelho',        fill: '#E63946', border: '#E63946' },
  'vermelho-preto': { label: 'Vermelho/Preto',  fill: '#8B0000', border: '#8B0000' },
  rosa:             { label: 'Rosa',            fill: '#FF95DF', border: '#FF95DF' },
  'rose-gold':      { label: 'Rosé Gold',       fill: '#B76E79', border: '#B76E79' },
  lilas:            { label: 'Lilás',           fill: '#C8A2C8', border: '#C8A2C8' },
  roxo:             { label: 'Roxo',            fill: '#6B2FBF', border: '#6B2FBF' },
  vinho:            { label: 'Vinho',           fill: '#722F37', border: '#722F37' },
  dourado:          { label: 'Dourado',         fill: '#D4AF37', border: '#C4A020' },
  amarelo:          { label: 'Amarelo',         fill: '#FFD700', border: '#D4AF00' },
  laranja:          { label: 'Laranja',         fill: '#FF6B35', border: '#E05020' },
  marrom:           { label: 'Marrom',          fill: '#8B4513', border: '#8B4513' },
}

export const COLOR_OPTIONS = Object.entries(COLOR_MAP).map(([value, info]) => ({
  value,
  ...info,
}))

export function getColorInfo(value: string): ColorInfo {
  // Busca direta pela chave
  if (COLOR_MAP[value]) return COLOR_MAP[value]

  const lower = value.toLowerCase()

  // Busca pela chave normalizada (case-insensitive)
  const byKey = Object.entries(COLOR_MAP).find(([k]) => k.toLowerCase() === lower)
  if (byKey) return byKey[1]

  // Busca pelo label (para itens salvos antes do enum, ex: "Azul" → azul)
  const byLabel = Object.values(COLOR_MAP).find(
    (info) => info.label.toLowerCase() === lower
  )
  if (byLabel) return byLabel

  return { label: value, fill: '#D0D0D0', border: '#B0B0B0' }
}
