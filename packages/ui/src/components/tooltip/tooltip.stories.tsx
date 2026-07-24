import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type TooltipSide = React.ComponentProps<typeof TooltipContent>["side"];

const meta = {
	title: "Components/Tooltip",
	component: Tooltip,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		side: {
			control: "select",
			options: ["top", "right", "bottom", "left", "inline-end", "inline-start"],
		},
		disableArrow: {
			control: "boolean",
			description: "Controls wheter the arrow is shown or not",
		},
	},
	args: {
		side: "top",
		disableArrow: false,
	},
	render: ({ side, disableArrow, ...args }) => (
		<Tooltip {...args}>
			<TooltipTrigger render={<Button variant="outline">Hover</Button>} />
			<TooltipContent disableArrow={disableArrow} side={side}>
				<p>Add to library</p>
			</TooltipContent>
		</Tooltip>
	),
} satisfies Meta<
	React.ComponentProps<typeof Tooltip> & {
		side?: TooltipSide;
		disableArrow?: boolean;
	}
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
