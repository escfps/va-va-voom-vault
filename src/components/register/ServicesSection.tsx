import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AVAILABLE_SERVICES } from "@/data/profileOptions";

interface ServiceState {
  name: string;
  does: boolean;
  description: string;
}

interface ServicesSectionProps {
  services: ServiceState[];
  onChange: (services: ServiceState[]) => void;
}

const ServicesSection = ({ services, onChange }: ServicesSectionProps) => {
  const toggle = (index: number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], does: !updated[index].does };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Serviços oferecidos</h4>
      <p className="text-xs text-muted-foreground">Marque os serviços que você oferece</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service, i) => (
          <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label className="text-sm font-medium">{service.name}</Label>
              <p className="text-xs text-muted-foreground">{service.description}</p>
            </div>
            <Switch checked={service.does} onCheckedChange={() => toggle(i)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicesSection;

export const defaultServices: ServiceState[] = AVAILABLE_SERVICES.map((s) => ({
  ...s,
  does: false,
}));

export function servicesToDb(services: ServiceState[]) {
  return services.map(({ name, does, description }) => ({ name, does, description }));
}

export function dbToServices(dbServices: { name: string; does: boolean; description: string }[]): ServiceState[] {
  return AVAILABLE_SERVICES.map((s) => {
    const found = dbServices.find((ds) => ds.name === s.name);
    return {
      name: s.name,
      description: s.description,
      does: found?.does || false,
    };
  });
}
