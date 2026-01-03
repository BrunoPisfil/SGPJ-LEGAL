import { cn } from "@/lib/utils"

interface MoneyProps {
  amount: number
  currency?: string
  className?: string
}

export function Money({ amount, currency = "S/", className }: MoneyProps) {
  const formatted = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return <span className={cn(className)}>{`${currency} ${formatted}`}</span>
}
