import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAYS_OF_WEEK } from "@/data/profileOptions";

interface ScheduleItem {
  day: string;
  hours: string | null;
  active: boolean;
}

interface ScheduleSectionProps {
  schedule: ScheduleItem[];
  onChange: (schedule: ScheduleItem[]) => void;
}

const ScheduleSection = ({ schedule, onChange }: ScheduleSectionProps) => {
  const updateDay = (index: number, field: keyof ScheduleItem, value: string | boolean | null) => {
    const updated = [...schedule];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "active" && !value) {
      updated[index].hours = null;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Horários de atendimento</h4>
      {schedule.map((item, i) => (
        <div key={item.day} className="flex items-center gap-3">
          <div className="w-32 flex-shrink-0">
            <Label className="text-sm">{item.day}</Label>
          </div>
          <Switch
            checked={item.active}
            onCheckedChange={(v) => updateDay(i, "active", v)}
          />
          {item.active && (
            <Input
              value={item.hours || ""}
              onChange={(e) => updateDay(i, "hours", e.target.value)}
              placeholder="08:00 - 22:00"
              className="flex-1"
            />
          )}
          {!item.active && (
            <span className="text-sm text-muted-foreground">Não atende</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default ScheduleSection;

export const defaultSchedule = DAYS_OF_WEEK.map((day) => ({
  day,
  hours: day === "Domingo" ? null : "08:00 - 22:00",
  active: day !== "Domingo",
}));

export function scheduleToDb(schedule: ScheduleItem[]) {
  return schedule.map(({ day, hours, active }) => ({
    day,
    hours: active ? hours : null,
  }));
}

export function dbToSchedule(dbSchedule: { day: string; hours: string | null }[]): ScheduleItem[] {
  return DAYS_OF_WEEK.map((day) => {
    const found = dbSchedule.find((s) => s.day === day);
    return {
      day,
      hours: found?.hours || null,
      active: !!found?.hours,
    };
  });
}
