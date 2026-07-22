import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
	"inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-ui-md font-semibold text-sm outline-none transition-colors duration-150 ease-out focus-visible:ring-[3px] focus-visible:ring-ui-ring disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-ui-accent text-ui-accent-foreground hover:bg-ui-accent/90",
				secondary: "bg-ui-muted text-ui-muted-foreground hover:bg-ui-muted/70",
				ghost: "text-ui-canvas-foreground hover:bg-ui-muted",
				danger: "bg-ui-danger text-ui-danger-foreground hover:bg-ui-danger/90",
			},
			size: {
				sm: "h-7 px-2.5 text-xs",
				md: "h-9 px-3.5",
				lg: "h-10 px-5 text-base",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<ButtonPrimitive
			className={cn(buttonVariants({ variant, size, className }))}
			data-slot="button"
			{...props}
		/>
	);
}

export { Button, type ButtonProps, buttonVariants };
