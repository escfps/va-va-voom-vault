import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHODS, PRICING_DURATIONS } from "@/data/profileOptions";
import { Plus, X } from "lucide-react";

interface PricingItem {
  duration: string;
  price: string;
}

interface PaymentSectionProps {
  paymentMethods: string[];
  onPaymentMethodsChange: (methods: string[]) => void;
  pricing: PricingItem[];
  onPricingChange: (pricing: PricingItem[]) => void;
}

const PaymentSection = ({ paymentMethods, onPaymentMethodsChange, pricing, onPricingChange }: PaymentSectionProps) => {
  const toggleMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      onPaymentMethodsChange(paymentMethods.filter((m) => m !== method));
    } else {
      onPaymentMethodsChange([...paymentMethods, method]);
    }
  };

  const addPricing = () => {
    const usedDurations = pricing.map((p) => p.duration);
    const next = PRICING_DURATIONS.find((d) => !usedDurations.includes(d));
    if (next) {
      onPricingChange([...pricing, { duration: next, price: "" }]);
    }
  };

  const removePricing = (index: number) => {
    onPricingChange(pricing.filter((_, i) => i !== index));
  };

  const updatePricing = (index: number, field: keyof PricingItem, value: string) => {
    const updated = [...pricing];
    updated[index] = { ...updated[index], [field]: value };
    onPricingChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Tabela de preços</h4>
        {pricing.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={item.duration}
              onChange={(e) => updatePricing(i, "duration", e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PRICING_DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              placeholder="R$"
              value={item.price}
              onChange={(e) => updatePricing(i, "price", e.target.value)}
              className="flex-1"
            />
            {pricing.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removePricing(i)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {pricing.length < PRICING_DURATIONS.length && (
          <Button type="button" variant="outline" size="sm" onClick={addPricing} className="gap-1">
            <Plus className="h-3 w-3" /> Adicionar faixa
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Formas de pagamento</h4>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <div key={method} className="flex items-center gap-2">
              <Checkbox
                checked={paymentMethods.includes(method)}
                onCheckedChange={() => toggleMethod(method)}
                id={`pay-${method}`}
              />
              <Label htmlFor={`pay-${method}`} className="text-sm cursor-pointer">{method}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
