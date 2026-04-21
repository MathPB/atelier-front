import { Sparkles, Gem, Shirt, Crown, Tag, Watch, Package } from 'lucide-react'

export function getCategoryIcon(name: string, className?: string) {
  const lower = name.toLowerCase()
  if (lower.includes('vestido') || lower.includes('festa') || lower.includes('gala'))
    return <Sparkles className={className} />
  if (lower.includes('terno') || lower.includes('masculino') || lower.includes('social') || lower.includes('blazer'))
    return <Shirt className={className} />
  if (lower.includes('joia') || lower.includes('bijou') || lower.includes('colar') || lower.includes('brinco'))
    return <Gem className={className} />
  if (lower.includes('noiva') || lower.includes('debutante') || lower.includes('princesa'))
    return <Crown className={className} />
  if (lower.includes('relogio') || lower.includes('relógio') || lower.includes('pulseira'))
    return <Watch className={className} />
  if (lower.includes('acess'))
    return <Package className={className} />
  return <Tag className={className} />
}
