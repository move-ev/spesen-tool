import { Button } from "@zemio/ui/components/button";
import { ButtonGroup } from "@zemio/ui/components/button-group";
import { useQueryState } from "nuqs";
import { parseAsStringEnum } from "nuqs/server";
import { cn } from "@/lib/utils";
import { Period } from "@/server/services/stats.service";

const periodParamsParser = {
	period: parseAsStringEnum<Period>(Object.values(Period)).withDefault(
		Period.DAY,
	),
} as const;

export function usePeriodSelector() {
	const [period, setPeriod] = useQueryState("period", periodParamsParser.period);

	return {
		period,
		setPeriod,
	};
}

export function PeriodSelector({
	className,
	...props
}: React.ComponentProps<typeof ButtonGroup>) {
	return (
		<ButtonGroup className={cn("group/period-selector", className)} {...props} />
	);
}

export function PeriodSelectorItem({
	value,
	className,
	...props
}: Omit<React.ComponentProps<typeof Button>, "value"> & { value: Period }) {
	const { period, setPeriod } = usePeriodSelector();

	return (
		<Button
			className={cn("data-[active=true]:bg-muted", className)}
			data-active={period === value}
			data-value={value}
			onClick={() => setPeriod(value)}
			variant={"outline"}
			{...props}
		/>
	);
}
